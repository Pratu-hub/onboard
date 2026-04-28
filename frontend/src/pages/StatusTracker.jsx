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
            <div className="flex items-center justify-center min-h-[60vh] glass-animate-in">
                <div className="text-center space-y-4">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin drop-shadow-[0_0_10px_rgba(24,86,255,0.8)]">progress_activity</span>
                    <p className="text-white/60 font-medium">Loading status tracker...</p>
                </div>
            </div>
        );
    }

    const verifiedCount = documents.filter(d => d.status === 'verified').length;
    const rejectedCount = documents.filter(d => d.status === 'rejected').length;
    const processingCount = documents.filter(d => d.status === 'ai_processing' || d.status === 'uploaded').length;
    const pendingCount = documents.filter(d => d.status === 'pending').length;

    const completedSteps = verifiedCount;
    const currentStep = completedSteps + 1;
    const totalSteps = documents.length;

    const activities = documents
        .filter(d => d.status !== 'pending')
        .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
        .slice(0, 5);

    return (
        <div className="font-body text-white antialiased pb-12 glass-animate-in">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />

            <div className="mb-10 pl-2">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-3 text-white drop-shadow-sm">Onboarding Progress</h1>
                <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
                    Track your document verification status in real-time. Please resolve any flagged items to proceed with your integration.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Column: Visual Stepper */}
                <div className="lg:col-span-8">
                    <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                        {/* Glow effect backer */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-bold font-headline text-white">Verification Lifecycle</h2>
                            <span className="glass-surface border border-white/10 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
                                Step {Math.min(currentStep, totalSteps)} of {totalSteps}
                            </span>
                        </div>

                        {/* Stepper */}
                        <div className="space-y-0 relative z-10">
                            {documents.map((doc, index) => {
                                const meta = getDocMeta(doc.doc_type);
                                const stepStatus = getStepStatus(doc);
                                const isLast = index === documents.length - 1;

                                const previousSteps = documents.slice(0, index);
                                const hasBlockingStep = previousSteps.some(d => d.status === 'rejected');
                                const isLocked = stepStatus === 'pending' && hasBlockingStep;

                                return (
                                    <div className="relative pb-10" key={doc.doc_type}>
                                        <div className={`flex items-start gap-6 ${isLocked ? 'opacity-40 grayscale' : ''} transition-all duration-300`}>
                                            {/* Step Indicator */}
                                            <div className="flex flex-col items-center">
                                                {/* Circle */}
                                                {stepStatus === 'validated' && (
                                                    <div className="z-10 w-12 h-12 rounded-full bg-success/20 border border-success/50 flex items-center justify-center text-success shadow-[0_0_15px_rgba(7,202,107,0.3)]">
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    </div>
                                                )}
                                                {stepStatus === 'rejected' && (
                                                    <div className="z-10 w-12 h-12 rounded-full bg-danger/20 border border-danger/50 flex items-center justify-center text-danger shadow-[0_0_15px_rgba(234,33,67,0.3)]">
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                                    </div>
                                                )}
                                                {stepStatus === 'processing' && (
                                                    <div className="z-10 w-12 h-12 rounded-full bg-info/20 border border-info/50 flex items-center justify-center text-info shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                                                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                                    </div>
                                                )}
                                                {stepStatus === 'pending' && (
                                                    <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed ${isLocked ? 'glass-surface text-white/30 border-white/10' : 'bg-primary/5 text-primary border-primary/30'}`}>
                                                        <span className="material-symbols-outlined text-[20px]">{isLocked ? 'lock' : 'hourglass_empty'}</span>
                                                    </div>
                                                )}

                                                {/* Connector Line */}
                                                {!isLast && (
                                                    <div className={`absolute top-12 bottom-0 left-6 -ml-px w-0.5 ${
                                                        stepStatus === 'validated' ? 'bg-success/50 shadow-[0_0_8px_rgba(7,202,107,0.5)]' :
                                                        stepStatus === 'rejected' ? 'bg-danger/50' :
                                                        stepStatus === 'processing' ? 'bg-info/50 shadow-[0_0_8px_rgba(56,189,248,0.5)]' :
                                                        'bg-transparent border-l-2 border-dashed border-white/10'
                                                    }`}></div>
                                                )}
                                            </div>

                                            {/* Step Content */}
                                            <div className="pt-2 flex-1 pb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className={`font-bold text-lg font-headline ${isLocked ? 'text-white/40' : stepStatus === 'pending' ? 'text-white/80' : 'text-white'}`}>
                                                        {meta.title}
                                                    </h3>
                                                    {stepStatus === 'validated' && (
                                                        <span className="text-success font-bold text-xs uppercase tracking-widest drop-shadow-[0_0_4px_rgba(7,202,107,0.6)]">Validated</span>
                                                    )}
                                                    {stepStatus === 'rejected' && (
                                                        <span className="text-danger font-bold text-xs uppercase tracking-widest drop-shadow-[0_0_4px_rgba(234,33,67,0.6)]">Action Required</span>
                                                    )}
                                                    {stepStatus === 'processing' && (
                                                        <span className="text-info font-bold text-xs uppercase tracking-widest drop-shadow-[0_0_4px_rgba(56,189,248,0.6)]">Processing</span>
                                                    )}
                                                    {stepStatus === 'pending' && !isLocked && (
                                                        <span className="text-white/40 font-bold text-xs uppercase tracking-widest">Pending</span>
                                                    )}
                                                    {isLocked && (
                                                        <span className="text-white/20 font-bold text-xs uppercase tracking-widest">Locked</span>
                                                    )}
                                                </div>

                                                {/* Validated content */}
                                                {stepStatus === 'validated' && (
                                                    <>
                                                        <p className="text-white/50 text-[11px] mb-4">
                                                            {doc.reviewed_at ? `Validated on ${formatDate(doc.reviewed_at)}` : 'Successfully verified.'}
                                                        </p>
                                                        <div className="glass-surface border border-success/20 p-3 rounded-xl flex items-center gap-3 w-fit">
                                                            <span className="material-symbols-outlined text-success text-sm">{meta.icon}</span>
                                                            <span className="text-xs font-semibold text-white/90">{doc.original_name || doc.filename || 'Document uploaded'}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Rejected content */}
                                                {stepStatus === 'rejected' && (
                                                    <>
                                                        <p className="text-white/50 text-[11px] mb-4">Verification failed. Please review and re-submit.</p>
                                                        <div className="glass-surface border border-danger/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-danger">{meta.icon}</span>
                                                                <span className="text-xs font-semibold text-danger drop-shadow-sm">
                                                                    {doc.reviewer_notes || 'The document did not pass verification.'}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUploadClick(doc.doc_type)}
                                                                className="bg-danger/20 hover:bg-danger/40 border border-danger/50 text-white text-[10px] font-bold px-4 py-2.5 rounded-lg uppercase tracking-widest whitespace-nowrap transition-colors"
                                                            >
                                                                Re-upload Now
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Processing content */}
                                                {stepStatus === 'processing' && (
                                                    <>
                                                        <p className="text-white/50 text-[11px] mb-4">
                                                            Document uploaded. Automated AI verification in progress.
                                                        </p>
                                                        <div className="glass-surface border border-info/20 p-3 rounded-xl flex items-center gap-3 max-w-md">
                                                            <span className="material-symbols-outlined text-info text-sm animate-pulse">{meta.icon}</span>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-semibold text-white block truncate">{doc.original_name || doc.filename || 'Processing...'}</span>
                                                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                                                                    <div className="bg-info h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Pending content */}
                                                {stepStatus === 'pending' && !isLocked && (
                                                    <>
                                                        <p className="text-white/40 text-[11px] mb-4">Awaiting your documentation to begin validation.</p>
                                                        <button
                                                            onClick={() => handleUploadClick(doc.doc_type)}
                                                            className="text-primary hover:text-white text-[10px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                                                        >
                                                            Upload Document <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                        </button>
                                                    </>
                                                )}

                                                {/* Locked content */}
                                                {isLocked && (
                                                    <p className="text-white/30 text-[11px]">Complete previous flagged steps to unlock.</p>
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
                        <div className="flex items-center justify-between mb-4 pl-1">
                            <h2 className="text-lg font-bold font-headline tracking-tight text-white">Recent Activity</h2>
                            {rejectedCount > 0 && (
                                <span className="w-6 h-6 rounded-lg bg-danger/20 border border-danger/50 text-danger text-[10px] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(234,33,67,0.4)]">
                                    {rejectedCount}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {/* Critical: Rejected Docs */}
                            {documents.filter(d => d.status === 'rejected').map(doc => {
                                const meta = getDocMeta(doc.doc_type);
                                return (
                                    <div key={`reject-${doc.doc_type}`} className="glass-surface border-l-4 border-l-danger border-r border-t border-b border-white/5 p-4 rounded-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-danger/10 rounded-full blur-[30px] -mr-10 -mt-10"></div>
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="material-symbols-outlined text-danger text-sm">warning</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-white mb-1">Action Required: {meta.title}</p>
                                                <p className="text-[11px] text-white/60 leading-relaxed mb-4">
                                                    {doc.reviewer_notes || 'Please re-upload this document.'}
                                                </p>
                                                <button
                                                    onClick={() => handleUploadClick(doc.doc_type)}
                                                    className="w-full py-2 bg-danger/20 hover:bg-danger/40 border border-danger/30 text-white rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-colors"
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
                                    <div key={`verified-${doc.doc_type}`} className="glass-surface p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="material-symbols-outlined text-success text-sm">verified</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-white mb-0.5">{meta.title} Confirmed</p>
                                                <p className="text-[10px] text-white/50 leading-relaxed">
                                                    Successfully validated by AI pipeline.
                                                </p>
                                                {doc.reviewed_at && (
                                                    <span className="text-[9px] text-white/30 mt-2 block font-mono">{getTimeAgo(doc.reviewed_at)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty state if no activity */}
                            {activities.length === 0 && (
                                <div className="glass-surface p-6 rounded-xl text-center border border-white/5">
                                    <span className="material-symbols-outlined text-white/20 text-3xl mb-2">inbox</span>
                                    <p className="text-xs text-white/40">No recent activity.</p>
                                </div>
                            )}

                            {/* Concierge Card */}
                            <div className="glass-panel p-5 rounded-xl relative overflow-hidden group mt-6 border border-primary/20 bg-primary/5">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/40 transition-colors duration-700"></div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-[0_0_15px_rgba(24,86,255,0.4)]">
                                        <span className="material-symbols-outlined">support_agent</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm mb-1">Need help?</h3>
                                        <p className="text-white/50 text-[10px] mb-2 leading-tight">HR concierge is available 24/7.</p>
                                        <a className="text-[10px] text-primary font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Chat Now →</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Office Location */}
                        <div className="mt-6 glass-panel p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-white/40 text-sm">location_on</span>
                                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Office</h4>
                            </div>
                            <div className="h-28 rounded-lg glass-surface overflow-hidden mb-3 relative border border-white/10">
                                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_rgba(24,86,255,1)] animate-pulse"></div>
                            </div>
                            <p className="text-xs font-bold font-headline text-white/90">OnboardIQ HQ - Seattle</p>
                            <p className="text-[10px] text-white/40 mt-0.5">455 Enterprise Way, Suite 200</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default StatusTracker;
