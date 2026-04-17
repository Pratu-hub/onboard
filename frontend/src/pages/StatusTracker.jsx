import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const StatusTracker = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingDocType, setUploadingDocType] = useState(null);
    const fileInputRef = useRef(null);

    const requiredTypes = ['government_id', 'offer_letter', 'education_cert', 'bank_details', 'nda'];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const data = await api('/documents');
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

        try {
            setDocuments(prev => prev.map(d =>
                d.doc_type === uploadingDocType ? { ...d, status: 'ai_processing' } : d
            ));

            const sasData = await api(`/documents/generate-sas?filename=${encodeURIComponent(file.name)}&doc_type=${uploadingDocType}&content_type=${encodeURIComponent(file.type)}`);
            const { uploadUrl, blobName, docType } = sasData;

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!uploadResponse.ok) throw new Error('Upload to storage failed');

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
            event.target.value = '';
            setUploadingDocType(null);
        }
    };

    const getDocMeta = (docType) => {
        switch (docType) {
            case 'government_id': return { title: 'Government Issued ID', icon: 'id_card', description: 'Government-issued photo identification document.' };
            case 'offer_letter': return { title: 'Employment Contract', icon: 'description', description: 'Signed employment offer letter and contract.' };
            case 'education_cert': return { title: 'Education Certificates', icon: 'school', description: 'Academic degrees and professional certifications.' };
            case 'bank_details': return { title: 'Bank & Tax Forms', icon: 'account_balance', description: 'Banking details for payroll and tax withholding forms.' };
            case 'nda': return { title: 'Non-Disclosure Agreement', icon: 'policy', description: 'Confidentiality and non-disclosure agreement.' };
            default: return { title: docType, icon: 'description', description: '' };
        }
    };

    const getStepStatus = (doc) => {
        if (doc.status === 'verified') return 'validated';
        if (doc.status === 'rejected') return 'rejected';
        if (doc.status === 'ai_processing' || doc.status === 'uploaded') return 'processing';
        return 'pending';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const then = new Date(dateStr);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} minutes ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
                    <p className="text-on-surface-variant font-medium">Loading status tracker...</p>
                </div>
            </div>
        );
    }

    const verifiedCount = documents.filter(d => d.status === 'verified').length;
    const rejectedCount = documents.filter(d => d.status === 'rejected').length;
    const processingCount = documents.filter(d => d.status === 'ai_processing' || d.status === 'uploaded').length;
    const pendingCount = documents.filter(d => d.status === 'pending').length;

    // Calculate which step user is currently on
    const completedSteps = verifiedCount;
    const currentStep = completedSteps + 1;
    const totalSteps = documents.length;

    // Build activity feed from document data
    const activities = documents
        .filter(d => d.status !== 'pending')
        .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
        .slice(0, 5);

    return (
        <div className="font-body text-on-surface antialiased">
            {/* Hidden File Input */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />

            {/* Header Section */}
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-2">Onboarding Progress</h1>
                <p className="text-on-surface-variant text-lg max-w-2xl">
                    Track your document verification status in real-time. Please resolve any flagged items to proceed with your integration.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Main Column: Visual Stepper */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-surface-container-lowest p-8 rounded-xl ring-1 ring-outline-variant/10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold font-headline">Verification Lifecycle</h2>
                            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Step {Math.min(currentStep, totalSteps)} of {totalSteps}
                            </span>
                        </div>

                        {/* Stepper */}
                        <div className="space-y-12">
                            {documents.map((doc, index) => {
                                const meta = getDocMeta(doc.doc_type);
                                const stepStatus = getStepStatus(doc);
                                const isLast = index === documents.length - 1;

                                // Determine if this step should appear locked
                                // A step is locked if all previous non-verified steps exist (i.e., there's a rejected or pending step before it)
                                const previousSteps = documents.slice(0, index);
                                const hasBlockingStep = previousSteps.some(d => d.status === 'rejected');
                                const isLocked = stepStatus === 'pending' && hasBlockingStep;

                                return (
                                    <div className="relative" key={doc.doc_type}>
                                        <div className={`flex items-start gap-6 ${isLocked ? 'opacity-40' : ''}`}>
                                            {/* Step Indicator */}
                                            <div className="flex flex-col items-center">
                                                {/* Circle */}
                                                {stepStatus === 'validated' && (
                                                    <div className="z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    </div>
                                                )}
                                                {stepStatus === 'rejected' && (
                                                    <div className="z-10 w-10 h-10 rounded-full bg-error flex items-center justify-center text-white shadow-lg">
                                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                                    </div>
                                                )}
                                                {stepStatus === 'processing' && (
                                                    <div className="z-10 w-10 h-10 rounded-full bg-tertiary flex items-center justify-center text-white shadow-lg">
                                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                    </div>
                                                )}
                                                {stepStatus === 'pending' && (
                                                    <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed ${isLocked ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : 'bg-surface-variant text-on-surface-variant border-outline'}`}>
                                                        <span className="material-symbols-outlined">{isLocked ? 'lock' : 'hourglass_empty'}</span>
                                                    </div>
                                                )}

                                                {/* Connector Line */}
                                                {!isLast && (
                                                    <div className={`w-0.5 h-20 mt-2 ${
                                                        stepStatus === 'validated' ? 'bg-primary' :
                                                        stepStatus === 'rejected' ? 'bg-error/30' :
                                                        stepStatus === 'processing' ? 'bg-tertiary/30' :
                                                        'bg-surface-container-high border-l border-dashed border-outline-variant'
                                                    }`}></div>
                                                )}
                                            </div>

                                            {/* Step Content */}
                                            <div className="pt-1 flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className={`font-bold text-lg font-headline ${isLocked ? '' : stepStatus === 'pending' ? 'opacity-60' : ''}`}>
                                                        {meta.title}
                                                    </h3>
                                                    {stepStatus === 'validated' && (
                                                        <span className="text-primary font-bold text-sm">Validated</span>
                                                    )}
                                                    {stepStatus === 'rejected' && (
                                                        <span className="text-error font-bold text-sm">Action Required</span>
                                                    )}
                                                    {stepStatus === 'processing' && (
                                                        <span className="text-tertiary font-bold text-sm">Processing</span>
                                                    )}
                                                    {stepStatus === 'pending' && !isLocked && (
                                                        <span className="text-on-surface-variant font-medium text-sm">Pending Upload</span>
                                                    )}
                                                    {isLocked && (
                                                        <span className="text-on-surface-variant font-medium text-sm">Locked</span>
                                                    )}
                                                </div>

                                                {/* Validated content */}
                                                {stepStatus === 'validated' && (
                                                    <>
                                                        <p className="text-on-surface-variant text-sm mb-4">
                                                            {doc.reviewed_at ? `Validated on ${formatDate(doc.reviewed_at)}` : 'Successfully verified.'}
                                                        </p>
                                                        <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-primary">{meta.icon}</span>
                                                            <span className="text-xs font-medium">{doc.original_name || doc.filename || 'Document uploaded'}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Rejected content */}
                                                {stepStatus === 'rejected' && (
                                                    <>
                                                        <p className="text-on-surface-variant text-sm mb-4">Verification failed. Please review and re-submit.</p>
                                                        <div className="bg-error-container/50 border border-error/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-error">{meta.icon}</span>
                                                                <span className="text-xs font-semibold text-on-error-container">
                                                                    {doc.reviewer_notes || 'The document did not pass verification. Please provide a valid copy.'}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUploadClick(doc.doc_type)}
                                                                className="bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-bold px-4 py-2 rounded-md uppercase tracking-wider whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
                                                            >
                                                                Re-upload Now
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Processing content */}
                                                {stepStatus === 'processing' && (
                                                    <>
                                                        <p className="text-on-surface-variant text-sm mb-4">
                                                            Document uploaded. Automated verification in progress.
                                                        </p>
                                                        <div className="bg-tertiary-fixed/30 border border-tertiary/10 p-3 rounded-lg flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-tertiary animate-pulse">{meta.icon}</span>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-medium block">{doc.original_name || doc.filename || 'Processing...'}</span>
                                                                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-2">
                                                                    <div className="bg-gradient-to-r from-tertiary to-tertiary-container h-full w-[65%] rounded-full animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Pending content */}
                                                {stepStatus === 'pending' && !isLocked && (
                                                    <>
                                                        <p className="text-on-surface-variant/60 text-sm mb-4">Awaiting your documentation to begin validation.</p>
                                                        <button
                                                            onClick={() => handleUploadClick(doc.doc_type)}
                                                            className="text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                                                        >
                                                            Upload Document →
                                                        </button>
                                                    </>
                                                )}

                                                {/* Locked content */}
                                                {isLocked && (
                                                    <p className="text-on-surface-variant text-sm">Complete previous flagged steps to unlock.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Side Column: Activity & Help */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="sticky top-24">
                        {/* Recent Activity */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold font-headline tracking-tight">Recent Activity</h2>
                            {rejectedCount > 0 && (
                                <span className="w-6 h-6 rounded-full bg-error text-white text-[10px] flex items-center justify-center font-bold">
                                    {rejectedCount}
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Critical: Rejected Docs */}
                            {documents.filter(d => d.status === 'rejected').map(doc => {
                                const meta = getDocMeta(doc.doc_type);
                                return (
                                    <div key={`reject-${doc.doc_type}`} className="bg-surface-container-lowest border-l-4 border-error p-5 rounded-xl shadow-sm ring-1 ring-error/10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-error text-xl">warning</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-on-surface mb-1">Action Required: {meta.title}</p>
                                                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                                                    {doc.reviewer_notes || 'Please re-upload this document with the corrections noted.'}
                                                </p>
                                                <button
                                                    onClick={() => handleUploadClick(doc.doc_type)}
                                                    className="w-full py-2 bg-error text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                                >
                                                    Re-upload Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Info: Verified Docs */}
                            {documents.filter(d => d.status === 'verified').slice(0, 3).map(doc => {
                                const meta = getDocMeta(doc.doc_type);
                                return (
                                    <div key={`verified-${doc.doc_type}`} className="bg-surface-container-low p-5 rounded-xl transition-all hover:bg-surface-container-high cursor-default">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-primary text-xl">info</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-on-surface mb-1">{meta.title} Confirmed</p>
                                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                                    HR has successfully validated your {meta.title.toLowerCase()}.
                                                </p>
                                                {doc.reviewed_at && (
                                                    <span className="text-[10px] text-outline mt-2 block">{getTimeAgo(doc.reviewed_at)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty state if no activity */}
                            {activities.length === 0 && (
                                <div className="bg-surface-container-low p-5 rounded-xl text-center">
                                    <span className="material-symbols-outlined text-outline text-3xl mb-2">inbox</span>
                                    <p className="text-sm text-on-surface-variant">No recent activity. Upload your first document to get started.</p>
                                </div>
                            )}

                            {/* HR Help Card */}
                            <div className="bg-gradient-to-br from-secondary to-secondary-container p-6 rounded-2xl relative overflow-hidden group shadow-md mt-10">
                                <div className="relative z-10">
                                    <h3 className="text-on-secondary font-bold text-lg font-headline mb-2 leading-tight">Need help with docs?</h3>
                                    <p className="text-on-secondary/80 text-sm mb-4">Our HR concierge is available 24/7 for onboarding assistance.</p>
                                    <button className="px-4 py-2 bg-white text-secondary text-[10px] font-extrabold rounded-md uppercase tracking-tighter hover:bg-white/90 transition-colors">
                                        Chat with Concierge
                                    </button>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-[120px]">support_agent</span>
                                </div>
                            </div>
                        </div>

                        {/* Office Location */}
                        <div className="mt-8 bg-surface-container-lowest p-4 rounded-xl ring-1 ring-outline-variant/10">
                            <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Office Location</h4>
                            <div className="h-32 rounded-lg bg-surface-variant overflow-hidden mb-3 relative">
                                <img
                                    className="w-full h-full object-cover"
                                    alt="Office location map"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYmr_YM8QQ_elbq-4FqlKbV1sPXN__TkkapJT5sGV8V_b7PUhicBf9gizZOuWkDKKkrgY70s6DB8izy3EHfjP4qo6kWAxT7UYHaTvlG1e_HMEwrp8c__9cgObyZw4RdAfSPWHoeLF8AbGF2imnbGC48PDRmE3q8A32IhUKmIqWNgNAemJdKX5CjK5rwFaXsO-CVHj4mByhn2k3oSF-wsRTIHzchbukfvhkvK4leH9-dKPKIJlKwTuH8_gs0zMxAk-ZwLzoqtFaVA"
                                />
                                <div className="absolute inset-0 bg-primary/10"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-xl animate-pulse"></div>
                            </div>
                            <p className="text-xs font-bold font-headline">OnboardIQ HQ - Seattle</p>
                            <p className="text-[10px] text-on-surface-variant">455 Enterprise Way, Suite 200</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default StatusTracker;
