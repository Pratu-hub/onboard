import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const NewHireDashboard = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingDocType, setUploadingDocType] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({}); // { [docType]: percentage }
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Auto-poll when documents are being processed by AI
    useEffect(() => {
        const hasProcessing = documents.some(d => 
            (['ai_processing', 'uploaded'].includes(d.status) || (d.status === 'flagged' && !d.ai_validation_status)) && d.filename
        );
        if (!hasProcessing) return;

        const interval = setInterval(() => {
            fetchDocuments();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [documents]);

    const fetchDocuments = async () => {
        try {
            const data = await api('/documents');
            const requiredTypes = ['government_id', 'offer_letter', 'education_cert', 'bank_details', 'nda'];
            let docs = data.documents || [];

            const finalDocs = requiredTypes.map(type => {
                const found = docs.find(d => d.doc_type === type);
                return found || { id: type, doc_type: type, status: 'pending', filename: null };
            });

            setDocuments(finalDocs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = (docType) => {
        setUploadingDocType(docType);
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !uploadingDocType) return;

        const currentDocType = uploadingDocType;
        const meta = getDocMeta(currentDocType);

        // Strict format validation
        if (meta.allowedTypes && !meta.allowedTypes.includes(file.type)) {
            alert(`Invalid file format for ${meta.title}. Allowed formats: ${meta.formats}`);
            event.target.value = '';
            setUploadingDocType(null);
            return;
        }

        try {
            // Set status to uploading and init progress at 0
            setDocuments(prev => prev.map(d =>
                d.doc_type === currentDocType ? { ...d, status: 'uploading' } : d
            ));
            setUploadProgress(prev => ({ ...prev, [currentDocType]: 0 }));

            // Step 1: Get SAS URL
            const sasData = await api(`/documents/generate-sas?filename=${encodeURIComponent(file.name)}&doc_type=${currentDocType}&content_type=${encodeURIComponent(file.type)}`);
            const { uploadUrl, blobName, docType } = sasData;

            // Step 2: Upload with real progress tracking via XMLHttpRequest
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(prev => ({ ...prev, [currentDocType]: percent }));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => reject(new Error('Upload to storage failed')));
                xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });

            // Step 3: Confirm upload
            setDocuments(prev => prev.map(d =>
                d.doc_type === currentDocType ? { ...d, status: 'ai_processing' } : d
            ));

            await api('/documents/confirm-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blobName, originalName: file.name, docType }),
            });

            // Step 4: Refresh documents to get the latest state from backend
            await fetchDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
            await fetchDocuments();
        } finally {
            // Cleanup progress after a short delay so user sees 100%
            setTimeout(() => {
                setUploadProgress(prev => {
                    const next = { ...prev };
                    delete next[currentDocType];
                    return next;
                });
            }, 500);
            event.target.value = '';
            setUploadingDocType(null);
        }
    };

    const handleViewDocument = async (doc) => {
        if (!doc.id || typeof doc.id === 'string') {
            alert('No file uploaded yet.');
            return;
        }

        try {
            const data = await api(`/documents/${doc.id}/view-url`);
            window.open(data.viewUrl, '_blank');
        } catch (error) {
            console.error('Failed to get view URL:', error);
            alert('Failed to open document: ' + error.message);
        }
    };

    const getDocMeta = (docType) => {
        switch (docType) {
            case 'government_id': 
                return { 
                    title: 'Government ID', 
                    icon: 'badge', 
                    formats: 'PDF, JPG, PNG',
                    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
                };
            case 'offer_letter': 
                return { 
                    title: 'Offer Letter', 
                    icon: 'contract', 
                    formats: 'PDF only',
                    allowedTypes: ['application/pdf']
                };
            case 'education_cert': 
                return { 
                    title: 'Education Certificates', 
                    icon: 'school', 
                    formats: 'PDF, JPG (Max 10MB)',
                    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
                };
            case 'bank_details': 
                return { 
                    title: 'Bank Details', 
                    icon: 'account_balance', 
                    formats: 'PDF, JPG (Max 10MB)',
                    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
                };
            case 'nda': 
                return { 
                    title: 'NDA', 
                    icon: 'policy', 
                    formats: 'PDF only',
                    allowedTypes: ['application/pdf']
                };
            default: 
                return { 
                    title: docType, 
                    icon: 'description', 
                    formats: 'Any',
                    allowedTypes: null 
                };
        }
    };

    if (loading) return <div className="p-8 text-center text-on-surface">Initializing Compliance Dashboard...</div>;

    const verifiedCount = documents.filter(d => d.status === 'verified').length;
    const processingCount = documents.filter(d => ['ai_processing', 'uploaded', 'uploading'].includes(d.status)).length;
    const flaggedCount = documents.filter(d => d.status === 'flagged').length;
    const pendingCount = documents.filter(d => d.status === 'pending').length;
    const progressPercent = Math.round((verifiedCount / 5) * 100);

    return (
        <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
            {/* Hidden File Input */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />



            <main className="w-full px-8 py-6 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(28,27,27,0.04)] flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface">Document Upload Dashboard</h1>
                                    <p className="text-sm text-on-surface-variant mt-1">Reviewing Case <span className="font-bold">#CASE-8492</span> • Candidate: <span className="font-bold">{user?.name || 'Jordan Miller'}</span></p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-primary font-headline">{progressPercent}%</span>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Completion</p>
                                </div>
                            </div>
                            <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-[#005faa] to-[#0078d4] h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <div className="flex gap-6 text-xs font-bold font-label uppercase tracking-tighter">
                                <div className="flex items-center gap-1.5 text-secondary">
                                    <span className="w-2 h-2 rounded-full bg-secondary"></span> {verifiedCount} Verified
                                </div>
                                <div className="flex items-center gap-1.5 text-primary">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> {processingCount} In Progress
                                </div>
                                <div className="flex items-center gap-1.5 text-error">
                                    <span className="w-2 h-2 rounded-full bg-error"></span> {flaggedCount} Flagged
                                </div>
                                <div className="flex items-center gap-1.5 text-outline">
                                    <span className="w-2 h-2 rounded-full bg-outline"></span> {pendingCount} Pending
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(28,27,27,0.04)] flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-tertiary mb-3">
                            <span className="material-symbols-outlined text-lg">verified_user</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Security Protocol</span>
                        </div>
                        <div className="space-y-3">
                            {['AES-256 Storage', 'Malware Scanning', 'Azure Tenant Lock'].map((item) => (
                                <div key={item} className="flex items-center justify-between">
                                    <span className="text-xs text-on-surface-variant">{item}</span>
                                    <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/20 font-bold">ISO 27001</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/20 font-bold">GDPR</span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-[0_4px_20px_rgba(28,27,27,0.04)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                                <input className="pl-10 pr-4 py-1.5 text-sm rounded-lg border-outline-variant/30 focus:ring-primary focus:border-primary w-64 bg-surface-container-low/50" placeholder="Filter documents..." type="text" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors">
                                    <span className="material-symbols-outlined text-sm">filter_list</span> Status
                                </button>
                                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors">
                                    <span className="material-symbols-outlined text-sm">sort</span> Latest
                                </button>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-on-surface-variant">Displaying 5 Document Requirements</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                                    <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Document Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Formats</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">File Info</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/5">
                                {documents.map((doc) => {
                                    const meta = getDocMeta(doc.doc_type);
                                    const isUploading = doc.status === 'uploading';
                                    const isProcessing = doc.status === 'ai_processing' || doc.status === 'uploaded';
                                    const isVerified = doc.status === 'verified';
                                    const isPending = doc.status === 'pending';
                                    const progress = uploadProgress[doc.doc_type] || 0;
                                    const hasFile = doc.filename && typeof doc.id === 'number';

                                    return (
                                        <tr key={doc.id} className={`hover:bg-surface-container-low transition-colors ${isUploading || isProcessing ? 'bg-primary/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`material-symbols-outlined ${isPending ? 'text-on-surface-variant' : 'text-primary'}`}>{meta.icon}</span>
                                                    <span className={`font-bold text-sm ${isPending ? 'text-on-surface-variant' : 'text-on-surface'}`}>{meta.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isVerified && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">Verified</span>}
                                                {isUploading && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container gap-1 w-fit">
                                                        <span className="material-symbols-outlined text-[10px] animate-spin">refresh</span>
                                                        Uploading {progress}%
                                                    </span>
                                                )}
                                                {isProcessing && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container gap-1 w-fit">
                                                        <span className="material-symbols-outlined text-[10px] animate-spin">refresh</span>
                                                        Processing
                                                    </span>
                                                )}
                                                {doc.status === 'flagged' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container gap-1 w-fit" title={doc.ai_summary}>
                                                        <span className="material-symbols-outlined text-[10px]">warning</span>
                                                        Flagged
                                                    </span>
                                                )}
                                                {doc.status === 'rejected' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-error text-white gap-1 w-fit" title={doc.ai_summary}>
                                                        <span className="material-symbols-outlined text-[10px]">error</span>
                                                        Re-upload Needed
                                                    </span>
                                                )}
                                                {isPending && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">Pending</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">{meta.formats}</td>
                                            <td className="px-6 py-4">
                                                {isVerified && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-on-surface">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-on-surface-variant">Uploaded recently</span>
                                                    </div>
                                                )}
                                                {isUploading && (
                                                    <div className="space-y-1">
                                                        <div className="w-32 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-[#005faa] to-[#0078d4] h-full rounded-full transition-all duration-300"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] text-primary font-bold">Uploading file...</span>
                                                    </div>
                                                )}
                                                {isProcessing && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-on-surface">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-primary font-bold">Awaiting verification</span>
                                                    </div>
                                                )}
                                                {doc.status === 'flagged' && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-on-surface">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-error font-bold">{doc.ai_summary || 'Needs review'}</span>
                                                    </div>
                                                )}
                                                {doc.status === 'rejected' && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-on-surface">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-error font-bold">File unreadable. Please re-upload.</span>
                                                    </div>
                                                )}
                                                {isPending && <span className="text-xs text-on-surface-variant italic">No file selected</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isVerified ? (
                                                        <>
                                                            <button className="text-primary hover:bg-primary/5 p-2 rounded transition-colors" title="View Document" onClick={() => handleViewDocument(doc)}><span className="material-symbols-outlined text-lg">visibility</span></button>
                                                            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded transition-colors" title="Replace" onClick={() => handleUploadClick(doc.doc_type)}><span className="material-symbols-outlined text-lg">sync</span></button>
                                                        </>
                                                    ) : isUploading ? (
                                                        <span className="text-primary text-xs font-bold uppercase tracking-widest px-3 py-1">{progress}%</span>
                                                    ) : isProcessing ? (
                                                        <>
                                                            {hasFile && (
                                                                <button className="text-primary hover:bg-primary/5 p-2 rounded transition-colors" title="View Document" onClick={() => handleViewDocument(doc)}><span className="material-symbols-outlined text-lg">visibility</span></button>
                                                            )}
                                                            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded transition-colors" title="Re-upload" onClick={() => handleUploadClick(doc.doc_type)}><span className="material-symbols-outlined text-lg">sync</span></button>
                                                        </>
                                                    ) : (
                                                        <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline px-3 py-1" onClick={() => handleUploadClick(doc.doc_type)}>Upload File</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-surface-container-low/10 border-t border-outline-variant/10">
                        <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">info</span> All uploaded files are automatically checked for document validity and authenticity.
                        </p>
                    </div>
                </div>

                <div className="mt-8 bg-surface-container-low/50 rounded-xl border border-outline-variant/10 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 h-32 md:h-auto overflow-hidden grayscale opacity-60">
                            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz3bqN0QfGpfWN_lEtJ5RY9CeLK6mvgbNxaVXs60_YpAcvD8XF_2MntMQiN74D6XOS40nXRBlsm3VqnfrljuiMEiYHgs8CjZ9WpjNxCaRpk6HExkswe82IZf6ogUzsoM99gjns_Zf5pvZG__68uITTOIIeyiQlhnMHzgZmUicexVrwjRxf6dvJJ4dx9TMtYsceFPWhPtkzayQvTrGwrIJ0UxOw0PXBZz0_O0WswYfdEsytx7uSuvHS53-RjCKQ1SdfRTKeK_1SXw" alt="System infrastructure" />
                        </div>
                        <div className="p-6 md:w-3/4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                                <span className="material-symbols-outlined text-sm">security</span>
                                <h4 className="font-headline font-bold uppercase tracking-widest text-[11px]">System Infrastructure</h4>
                            </div>
                            <p className="text-on-surface-variant text-xs leading-relaxed max-w-3xl">
                                Documents are processed through the Editorial Security Pipeline. Assets are encrypted with AES-256 at rest. Verification is performed against Microsoft Azure Security protocols to ensure data integrity and compliance with international standards including ISO 27001 and GDPR.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-auto px-8 py-4 border-t border-outline-variant/10 flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <div>© 2024 Compliance Control Panel</div>
                <div className="flex gap-4">
                    <a className="hover:text-primary" href="#">System Status</a>
                    <a className="hover:text-primary" href="#">Documentation</a>
                    <a className="hover:text-primary" href="#">Support</a>
                </div>
            </footer>
        </div>
    );
};

export default NewHireDashboard;
