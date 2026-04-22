import React, { useState, useEffect } from 'react';
import { api } from '../../../api';
import AuditLogView from './AuditLogView';

const CaseDetailView = ({ currentCase, onBack, onVerify, onReject, onApproveAll }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Modal & Toast states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [docToReject, setDocToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Default to first document on load
  useEffect(() => {
    if (currentCase?.documents?.length > 0 && !selectedDocId) {
      setSelectedDocId(currentCase.documents[0].id);
    }
  }, [currentCase, selectedDocId]);

  // Fetch preview URL when a document is selected
  useEffect(() => {
    if (selectedDocId && !previewUrls[selectedDocId]) {
      fetchPreviewUrl(selectedDocId);
    }
  }, [selectedDocId]);

  const fetchPreviewUrl = async (docId) => {
    setLoadingPreview(true);
    try {
      const data = await api(`/documents/${docId}/view-url`);
      setPreviewUrls(prev => ({ ...prev, [docId]: data.viewUrl }));
    } catch (err) {
      console.error('Failed to fetch preview URL:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenRejectModal = (doc) => {
    setDocToReject(doc);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!docToReject || !rejectionReason.trim()) return;
    
    try {
      await onReject(docToReject.id, rejectionReason);
      setIsRejectModalOpen(false);
      setDocToReject(null);
      setRejectionReason('');
      
      // Show success toast
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  if (!currentCase) return null;

  const selectedDoc = currentCase.documents.find(d => d.id === selectedDocId) || currentCase.documents[0];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified': return <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> Verified</span>;
      case 'flagged': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-tighter">Flagged</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold uppercase tracking-tighter">Rejected</span>;
      case 'pending':
      case 'uploaded': return <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded text-[10px] font-bold uppercase tracking-tighter">Needs Review</span>;
      case 'ai_processing': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase tracking-tighter">AI Processing</span>;
      default: return null;
    }
  };

  const getDocIcon = (type) => {
    if (type.includes('id')) return 'id_card';
    if (type.includes('offer')) return 'description';
    if (type.includes('background')) return 'fact_check';
    return 'article';
  };

  return (
    <div className="bg-[#fdf8f6] h-full flex flex-col relative overflow-hidden">
      
      {/* ── Case Profile Ribbon ── */}
      <section className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/10 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center text-white font-headline text-2xl font-bold shadow-sm">
              {currentCase.user_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Case #IQ-{currentCase.user_id + 8000}-X</span>
                  <h2 className="text-2xl font-headline font-extrabold tracking-tight text-on-surface">{currentCase.user_name}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 ml-8 md:ml-0">
                <span className="text-sm font-medium flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">badge</span> {currentCase.user_role?.replace('_', ' ') || 'Candidate'}
                </span>
                <span className="text-sm font-medium flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">corporate_fare</span> {currentCase.user_department || 'Engineering'}
                </span>
                <span className="text-sm font-medium flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">calendar_today</span> {new Date(currentCase.user_joining_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-sm font-medium flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">person</span> {currentCase.user_manager_name || 'Marcus Thorne'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onApproveAll}
            className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-xl font-headline text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">done_all</span> Approve All Documents
          </button>
        </div>
      </section>

      {/* ── Main Workspace Split ── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden pb-14">
        
        {/* ── Left: Document List ── */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 overflow-y-auto p-8 space-y-4 bg-surface border-r border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-headline font-bold text-on-surface uppercase tracking-widest">Case Documents</h3>
            <span className="px-2 py-1 bg-tertiary-container/10 text-tertiary-container rounded text-[10px] font-bold uppercase">AI Analysis Active</span>
          </div>

          {currentCase.documents.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`group p-5 rounded-xl border-2 transition-all cursor-pointer ${
                selectedDocId === doc.id 
                  ? 'bg-surface-container-lowest border-primary ring-4 ring-primary/5' 
                  : 'bg-surface-container-lowest border-transparent hover:bg-surface-container-low border-outline-variant/5'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedDocId === doc.id ? 'bg-primary-fixed-dim/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                    <span className="material-symbols-outlined">{getDocIcon(doc.doc_type)}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface capitalize">{doc.doc_type.replace('_', ' ')}</h4>
                    <p className="text-[10px] text-on-surface-variant">
                      {doc.uploaded_at ? `Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()} • PDF` : 'Pending Upload'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>

              {doc.ai_summary && (
                <div className={`p-3 rounded-lg mb-4 relative overflow-hidden ${doc.status === 'flagged' ? 'bg-amber-50 border border-amber-100' : 'bg-surface-container-low'}`}>
                  {doc.status !== 'flagged' && (
                    <div className="absolute top-0 right-0 p-1.5 text-primary opacity-50">
                      <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                    </div>
                  )}
                  <p className={`text-xs leading-relaxed ${doc.status === 'flagged' ? 'text-amber-800' : 'text-on-surface-variant'} italic`}>
                    {doc.ai_summary}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onVerify(doc.id); }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Approve
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenRejectModal(doc); }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Reject
                </button>
                <button className="p-2 border border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">history</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Preview Panel ── */}
        <div className="hidden lg:block lg:col-span-7 xl:col-span-8 bg-surface-container-low p-8 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-headline font-bold text-on-surface">
                Preview: {selectedDoc?.original_name || 'Document'}
              </h3>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-surface-container-high rounded-md transition-colors"><span className="material-symbols-outlined text-lg">zoom_in</span></button>
                <button className="p-1.5 hover:bg-surface-container-high rounded-md transition-colors"><span className="material-symbols-outlined text-lg">zoom_out</span></button>
                <button className="p-1.5 hover:bg-surface-container-high rounded-md transition-colors"><span className="material-symbols-outlined text-lg">rotate_right</span></button>
              </div>
            </div>
            <a 
              href={previewUrls[selectedDocId]} 
              download 
              className="text-sm font-semibold text-primary flex items-center gap-1.5 hover:underline"
            >
              <span className="material-symbols-outlined text-base">download</span> Download Original
            </a>
          </div>

          <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20 bg-white group relative">
            {loadingPreview ? (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined animate-spin text-3xl">refresh</span>
                  <span className="text-sm font-medium">Fetching preview...</span>
                </div>
              </div>
            ) : previewUrls[selectedDocId] ? (
              <iframe 
                src={previewUrls[selectedDocId]} 
                className="w-full h-full border-none"
                title="Document Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant italic">
                No document preview available.
              </div>
            )}
            
            {/* AI Data Overlay Mockup Layer */}
            {selectedDoc?.status === 'verified' && !loadingPreview && previewUrls[selectedDocId] && (
              <div className="absolute inset-0 pointer-events-none p-12">
                <div className="w-1/3 h-12 border-2 border-primary/40 bg-primary/5 absolute top-1/4 left-1/4 rounded flex items-center justify-center">
                  <span className="bg-primary text-white text-[8px] font-bold px-1 absolute -top-2 left-2 rounded uppercase">Name_Match</span>
                </div>
                <div className="w-1/4 h-8 border-2 border-primary/40 bg-primary/5 absolute top-[45%] left-1/2 rounded flex items-center justify-center">
                  <span className="bg-primary text-white text-[8px] font-bold px-1 absolute -top-2 left-2 rounded uppercase">Exp_Date</span>
                </div>
              </div>
            )}

            {/* Floating Glass Actions */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-lg">
              <button className="px-4 py-2 bg-surface-container-lowest hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">first_page</span> Previous
              </button>
              <div className="px-4 py-2 border-x border-outline-variant/30 text-xs font-bold text-on-surface-variant">
                1 of 1 Pages
              </div>
              <button className="px-4 py-2 bg-surface-container-lowest hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface transition-all flex items-center gap-2">
                Next <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Collapsible Audit Log ── */}
      <AuditLogView userId={currentCase.user_id} />

      {/* ── Reject Modal Overlay ── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-error font-bold">
                    <span className="material-symbols-outlined">report</span>
                    <span className="text-xs tracking-widest uppercase">Action Required</span>
                  </div>
                  <h2 className="text-2xl font-headline font-extrabold tracking-tight">Reject Document</h2>
                  <p className="text-sm text-on-surface-variant">
                    You are rejecting <strong>{docToReject?.doc_type.replace('_', ' ')}</strong>. Please provide a clear reason for the candidate to address.
                  </p>
                </div>
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Reason for Rejection</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400" 
                  placeholder="e.g., The scan is blurry and the expiration date is not legible. Please provide a high-resolution color scan of your valid passport or driver's license." 
                  rows="4"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-headline font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  Send Re-upload Request
                </button>
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="w-full py-3 text-on-surface-variant font-bold text-sm tracking-widest uppercase hover:bg-surface-container-high rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="bg-surface-container-low px-8 py-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>info</span>
              <p className="text-[10px] text-on-surface-variant font-medium">Candidate will receive an automated notification via the OnboardIQ Mobile App.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Toast ── */}
      {showSuccessToast && (
        <div className="fixed top-20 right-8 z-[70] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 p-4 bg-white shadow-2xl rounded-xl border-l-4 border-green-500 min-w-[320px]">
            <div className="flex-shrink-0 w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">send</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-on-surface">Success</p>
              <p className="text-[11px] text-on-surface-variant">Rejection email sent to user via Azure Communication Services.</p>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetailView;
