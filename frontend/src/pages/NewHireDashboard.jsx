import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

/**
 * Parses the ai_summary field which may be:
 *  - A JSON string with { aiSummary, crossVerification } structure
 *  - A plain text string
 * Returns a structured object for clean rendering.
 */
const parseAiSummary = (raw) => {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return {
            isStructured: true,
            verdict: (parsed.aiSummary || '').split('|')[0].trim(),
            crossVerification: parsed.crossVerification || null,
            flags: parsed.crossVerification?.flags || [],
            confidence: parsed.crossVerification?.confidence ?? null,
            verified: parsed.crossVerification?.verified ?? null,
        };
    } catch {
        // Plain text summary
        return {
            isStructured: false,
            verdict: raw,
            crossVerification: null,
            flags: [],
            confidence: null,
            verified: null,
        };
    }
};

const NewHireDashboard = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingDocType, setUploadingDocType] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({}); // { [docType]: percentage }
    const [aiModalDoc, setAiModalDoc] = useState(null); // Document to show in AI analysis modal
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        checkStatusAndFetch();
    }, []);

    const checkStatusAndFetch = async () => {
        try {
            const statusData = await api('/onboarding/my-status');
            if (statusData.onboardingComplete) {
                navigate('/dashboard/welcome-hub', { replace: true });
                return;
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        }
        
        await fetchDocuments();
    };

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
            setDocuments(prev => prev.map(d =>
                d.doc_type === currentDocType ? { ...d, status: 'uploading' } : d
            ));
            setUploadProgress(prev => ({ ...prev, [currentDocType]: 0 }));

            const sasData = await api(`/documents/generate-sas?filename=${encodeURIComponent(file.name)}&doc_type=${currentDocType}&content_type=${encodeURIComponent(file.type)}`);
            const { uploadUrl, blobName, docType } = sasData;

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

            setDocuments(prev => prev.map(d =>
                d.doc_type === currentDocType ? { ...d, status: 'ai_processing' } : d
            ));

            await api('/documents/confirm-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blobName, originalName: file.name, docType }),
            });

            await fetchDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
            await fetchDocuments();
        } finally {
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

    if (loading) return <div className="p-8 text-center text-white/50 glass-animate-in">Initializing Compliance Dashboard...</div>;

    const verifiedCount = documents.filter(d => d.status === 'verified').length;
    const processingCount = documents.filter(d => ['ai_processing', 'uploaded', 'uploading'].includes(d.status)).length;
    const flaggedCount = documents.filter(d => d.status === 'flagged').length;
    const pendingCount = documents.filter(d => d.status === 'pending').length;
    const progressPercent = Math.round((verifiedCount / 5) * 100);

    return (
        <div className="font-body text-white antialiased min-h-screen pb-12 glass-animate-in">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />

            <main className="w-full max-w-[1600px] mx-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Header Card */}
                    <div className="lg:col-span-3 glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-extrabold font-headline tracking-tight text-white">Document Upload Dashboard</h1>
                                    <p className="text-sm text-white/60 mt-1">Onboarding Portal <span className="material-symbols-outlined text-[10px] align-middle mx-1">chevron_right</span> Candidate: <span className="font-bold text-white">{user?.name || 'Jordan Miller'}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Security Card */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center gap-3 text-white mb-4">
                            <span className="material-symbols-outlined text-xl text-success drop-shadow-[0_0_5px_rgba(7,202,107,0.5)]">verified_user</span>
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Security Protocol</span>
                        </div>
                        <div className="space-y-3">
                            {['AES-256 Storage', 'Malware Scanning', 'Azure Tenant Lock'].map((item) => (
                                <div key={item} className="flex items-center justify-between glass-surface px-3 py-2 rounded-lg">
                                    <span className="text-[11px] font-semibold text-white/80">{item}</span>
                                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <span className="text-[9px] px-2 py-1 rounded-md glass-surface text-white/60 font-bold tracking-wider">ISO 27001</span>
                            <span className="text-[9px] px-2 py-1 rounded-md glass-surface text-white/60 font-bold tracking-wider">GDPR</span>
                        </div>
                    </div>
                </div>

                {/* Documents Table */}
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">search</span>
                                <input className="pl-10 pr-4 py-2 text-sm rounded-xl border border-white/[0.08] focus:ring-1 focus:ring-primary/50 focus:border-primary/50 w-full md:w-64 glass-surface text-white placeholder:text-white/30 outline-none transition-all" placeholder="Filter documents..." type="text" />
                            </div>
                            <div className="flex items-center gap-2 hidden md:flex">
                                <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-white/[0.1] rounded-xl hover:bg-white/[0.06] transition-colors text-white/70">
                                    <span className="material-symbols-outlined text-sm">filter_list</span> Status
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-white/[0.1] rounded-xl hover:bg-white/[0.06] transition-colors text-white/70">
                                    <span className="material-symbols-outlined text-sm">sort</span> Latest
                                </button>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest hidden md:block">5 Requirements</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">Document Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">Formats</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">File Info</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {documents.map((doc) => {
                                    const meta = getDocMeta(doc.doc_type);
                                    const isUploading = doc.status === 'uploading';
                                    const isProcessing = doc.status === 'ai_processing' || doc.status === 'uploaded';
                                    const isVerified = doc.status === 'verified';
                                    const isPending = doc.status === 'pending';
                                    const progress = uploadProgress[doc.doc_type] || 0;
                                    const hasFile = doc.filename && typeof doc.id === 'number';

                                    return (
                                        <tr key={doc.id} className={`hover:bg-white/[0.03] transition-colors ${isUploading || isProcessing ? 'bg-primary/[0.03]' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPending ? 'bg-white/5 text-white/40' : 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(24,86,255,0.2)]'}`}>
                                                        <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                                                    </div>
                                                    <span className={`font-semibold text-sm ${isPending ? 'text-white/60' : 'text-white'}`}>{meta.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isVerified && <span className="badge-success px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">Verified</span>}
                                                {isUploading && (
                                                    <span className="badge-info px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <span className="material-symbols-outlined text-[10px] animate-spin">refresh</span>
                                                        Uploading {progress}%
                                                    </span>
                                                )}
                                                {isProcessing && (
                                                    <span className="badge-info px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                        <span className="material-symbols-outlined text-[10px] animate-spin">refresh</span>
                                                        Processing
                                                    </span>
                                                )}
                                                {doc.status === 'flagged' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setAiModalDoc(doc); }}
                                                        className="badge-warning px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit cursor-pointer hover:opacity-80 transition-opacity border-none"
                                                    >
                                                        <span className="material-symbols-outlined text-[10px]">warning</span>
                                                        Flagged
                                                    </button>
                                                )}
                                                {doc.status === 'rejected' && (
                                                    <span className="badge-danger px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit" title={doc.ai_summary}>
                                                        <span className="material-symbols-outlined text-[10px]">error</span>
                                                        Re-upload Needed
                                                    </span>
                                                )}
                                                {isPending && <span className="badge-neutral px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">Pending</span>}
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-white/50 font-medium">{meta.formats}</td>
                                            <td className="px-6 py-4">
                                                {isVerified && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-white truncate max-w-[150px]">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-white/40 mt-0.5 font-mono">Verified</span>
                                                    </div>
                                                )}
                                                {isUploading && (
                                                    <div className="space-y-1.5">
                                                        <div className="w-32 glass-surface h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                                                            <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] text-primary font-bold">Uploading file...</span>
                                                    </div>
                                                )}
                                                {isProcessing && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-white truncate max-w-[150px]">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-info font-bold mt-0.5">Awaiting verification</span>
                                                    </div>
                                                )}
                                                {doc.status === 'flagged' && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-white truncate max-w-[150px]">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-warning font-bold mt-0.5">Review Analysis Required</span>
                                                    </div>
                                                )}
                                                {doc.status === 'rejected' && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-white truncate max-w-[150px]">{doc.original_name || doc.filename}</span>
                                                        <span className="text-[10px] text-danger font-bold mt-0.5">File unreadable. Re-upload.</span>
                                                    </div>
                                                )}
                                                {isPending && <span className="text-[11px] text-white/30 font-mono italic">No file selected</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isVerified ? (
                                                        <>
                                                            <button className="text-white hover:text-primary glass-surface hover:bg-white/10 p-2 rounded-xl transition-all border-none" title="View Document" onClick={() => handleViewDocument(doc)}><span className="material-symbols-outlined text-lg">visibility</span></button>
                                                            <button className="text-white/60 hover:text-white glass-surface hover:bg-white/10 p-2 rounded-xl transition-all border-none" title="Replace" onClick={() => handleUploadClick(doc.doc_type)}><span className="material-symbols-outlined text-lg">sync</span></button>
                                                        </>
                                                    ) : isUploading ? (
                                                        <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] px-3 py-1">{progress}%</span>
                                                    ) : isProcessing ? (
                                                        <>
                                                            {hasFile && (
                                                                <button className="text-white hover:text-primary glass-surface hover:bg-white/10 p-2 rounded-xl transition-all border-none" title="View Document" onClick={() => handleViewDocument(doc)}><span className="material-symbols-outlined text-lg">visibility</span></button>
                                                            )}
                                                            <button className="text-white/60 hover:text-white glass-surface hover:bg-white/10 p-2 rounded-xl transition-all border-none" title="Re-upload" onClick={() => handleUploadClick(doc.doc_type)}><span className="material-symbols-outlined text-lg">sync</span></button>
                                                        </>
                                                    ) : (
                                                        <button className="text-primary text-[10px] font-bold uppercase tracking-[0.1em] hover:text-white bg-primary/10 hover:bg-primary/30 border border-primary/30 px-4 py-2 rounded-lg transition-colors cursor-pointer" onClick={() => handleUploadClick(doc.doc_type)}>Upload File</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Infrastructure Footer Card */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl glass-surface flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl drop-shadow-[0_0_8px_rgba(24,86,255,0.6)]">hub</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">System Infrastructure Pipeline</h4>
                            <p className="text-[11px] text-white/50 max-w-xl leading-relaxed">
                                Documents are processed via AI pipeline with AES-256 encryption. Azure Security protocols ensure data integrity compliance (ISO 27001).
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <a className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors cursor-pointer">Status</a>
                        <a className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors cursor-pointer">Support</a>
                    </div>
                </div>
            </main>

            {/* ── AI Analysis Modal ── */}
            {aiModalDoc && (() => {
                const parsed = parseAiSummary(aiModalDoc.ai_summary);
                const meta = getDocMeta(aiModalDoc.doc_type);
                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6" onClick={() => setAiModalDoc(null)}>
                        <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-warning">document_scanner</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{meta.title} — AI Analysis</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Automated Verification Report</p>
                                    </div>
                                </div>
                                <button onClick={() => setAiModalDoc(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* AI Verdict */}
                                <div className="glass-surface rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">AI Verdict</span>
                                    </div>
                                    <p className="text-sm text-white/90 leading-relaxed">{parsed?.verdict || 'No analysis available.'}</p>
                                </div>

                                {/* Cross-Verification Flags */}
                                {parsed?.flags?.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-warning text-sm">flag</span>
                                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Cross-Verification Flags</span>
                                        </div>
                                        {parsed.flags.map((flag, i) => (
                                            <div key={i} className="glass-surface rounded-lg px-4 py-3 flex items-start gap-3">
                                                <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0" style={{color: flag.startsWith('⚠️') ? '#f59e0b' : flag.startsWith('✅') ? '#07ca6b' : '#94a3b8'}}>
                                                    {flag.startsWith('⚠️') ? 'warning' : flag.startsWith('✅') ? 'check_circle' : 'info'}
                                                </span>
                                                <span className="text-xs text-white/80 leading-relaxed">{flag.replace(/^[⚠️✅ℹ️]+\s*/, '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Confidence & Status */}
                                {parsed?.isStructured && (
                                    <div className="flex items-center gap-4">
                                        {parsed.confidence !== null && (
                                            <div className="glass-surface rounded-lg px-4 py-3 flex-1">
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Confidence</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${parsed.confidence >= 0.7 ? 'bg-success' : parsed.confidence >= 0.4 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${parsed.confidence * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-white">{Math.round(parsed.confidence * 100)}%</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="glass-surface rounded-lg px-4 py-3">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Identity Match</p>
                                            <span className={`text-xs font-bold ${parsed.verified ? 'text-success' : 'text-warning'}`}>
                                                {parsed.verified ? '✓ Verified' : '✗ Mismatch'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-2">
                                <span className="material-symbols-outlined text-white/30 text-sm">info</span>
                                <p className="text-[10px] text-white/30">This analysis was generated by Azure Document Intelligence + GPT-4o. An HR reviewer will make the final decision.</p>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default NewHireDashboard;
