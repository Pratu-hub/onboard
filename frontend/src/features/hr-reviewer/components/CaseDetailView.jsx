import React, { useState, useEffect } from 'react';
import { api } from '../../../api';
import AuditLogView from './AuditLogView';

const CaseDetailView = ({ currentCase, onBack, onVerify, onReject, onApproveAll }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [docToReject, setDocToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (currentCase?.documents?.length > 0 && !selectedDocId) {
      setSelectedDocId(currentCase.documents[0].id);
    }
  }, [currentCase, selectedDocId]);

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
      case 'verified': return <span className="badge-success px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5"><span className="material-symbols-outlined text-[10px]">check_circle</span> Verified</span>;
      case 'flagged': return <span className="badge-warning px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.15em]">Flagged</span>;
      case 'rejected': return <span className="badge-danger px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.15em]">Rejected</span>;
      case 'pending':
      case 'uploaded': return <span className="badge-neutral px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.15em]">Needs Review</span>;
      case 'ai_processing': return <span className="badge-info px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.15em]">AI Processing</span>;
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
    <div className="h-full flex flex-col relative overflow-hidden text-white font-body glass-animate-in">
      
      {/* ── Case Profile Ribbon ── */}
      <section className="px-8 py-6 glass-panel border-b border-white/10 flex-shrink-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-headline text-2xl font-bold shadow-[0_0_15px_rgba(24,86,255,0.3)]">
              {currentCase.user_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-8 h-8 rounded-full glass-surface flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer border border-white/5">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5 drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]">Case #IQ-{currentCase.user_id + 8000}-X</span>
                  <h2 className="text-2xl font-headline font-extrabold tracking-tight text-white">{currentCase.user_name}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 ml-12 md:ml-0">
                <span className="text-xs font-medium flex items-center gap-2 text-white/60">
                  <span className="material-symbols-outlined text-sm">badge</span> {currentCase.user_role?.replace('_', ' ') || 'Candidate'}
                </span>
                <span className="text-xs font-medium flex items-center gap-2 text-white/60">
                  <span className="material-symbols-outlined text-sm">corporate_fare</span> {currentCase.user_department || 'Engineering'}
                </span>
                <span className="text-xs font-medium flex items-center gap-2 text-white/60">
                  <span className="material-symbols-outlined text-sm">calendar_today</span> {new Date(currentCase.user_joining_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs font-medium flex items-center gap-2 text-white/60">
                  <span className="material-symbols-outlined text-sm">person</span> {currentCase.user_manager_name || 'Marcus Thorne'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onApproveAll}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-xl font-headline text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(24,86,255,0.4)] transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">done_all</span> Approve All Documents
          </button>
        </div>
      </section>

      {/* ── Main Workspace Split ── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden pb-14 relative z-0">
        
        {/* ── Left: Document List ── */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 overflow-y-auto p-6 space-y-4 glass-panel border-r border-white/5 border-t-0 rounded-none bg-transparent/20">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xs font-headline font-bold text-white/80 uppercase tracking-[0.2em]">Case Documents</h3>
            <span className="badge-info px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span> Active AI
            </span>
          </div>

          {currentCase.documents.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`group p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                selectedDocId === doc.id 
                  ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(24,86,255,0.15)] scale-[1.02]' 
                  : 'glass-surface border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${selectedDocId === doc.id ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(24,86,255,0.3)]' : 'bg-white/5 text-white/60'}`}>
                    <span className="material-symbols-outlined text-xl">{getDocIcon(doc.doc_type)}</span>
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold capitalize transition-colors ${selectedDocId === doc.id ? 'text-white' : 'text-white/80'}`}>{doc.doc_type.replace('_', ' ')}</h4>
                    <p className="text-[10px] font-mono text-white/40 mt-1">
                      {doc.uploaded_at ? `Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()}` : 'Pending Upload'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>

              {doc.ai_summary && (() => {
                const parsed = (() => {
                  try {
                    const p = JSON.parse(doc.ai_summary);
                    return {
                      verdict: (p.aiSummary || '').split('|')[0].trim(),
                      flags: p.crossVerification?.flags || [],
                      confidence: p.crossVerification?.confidence ?? null,
                      verified: p.crossVerification?.verified ?? null,
                      isStructured: true
                    };
                  } catch {
                    return { verdict: doc.ai_summary, flags: [], confidence: null, verified: null, isStructured: false };
                  }
                })();

                return (
                  <div className={`p-4 rounded-xl mb-4 space-y-3 border ${doc.status === 'flagged' ? 'bg-warning/5 border-warning/20' : 'glass-surface border-white/5'}`}>
                    {/* Verdict Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xs" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">AI Analysis Report</span>
                      </div>
                      {parsed.confidence !== null && (
                        <span className={`text-[10px] font-bold ${parsed.confidence >= 0.7 ? 'text-success' : parsed.confidence >= 0.4 ? 'text-warning' : 'text-danger'}`}>
                          {Math.round(parsed.confidence * 100)}% Conf.
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-xs font-medium leading-relaxed ${doc.status === 'flagged' ? 'text-warning/90' : 'text-white/70'}`}>
                      {parsed.verdict}
                    </p>

                    {/* Flags Breakdown */}
                    {parsed.flags.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {parsed.flags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] text-white/50 bg-white/5 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-[12px] mt-0.5" style={{color: flag.startsWith('⚠️') ? '#f59e0b' : flag.startsWith('✅') ? '#07ca6b' : '#94a3b8'}}>
                              {flag.startsWith('⚠️') ? 'warning' : flag.startsWith('✅') ? 'check_circle' : 'info'}
                            </span>
                            <span>{flag.replace(/^[⚠️✅ℹ️]+\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Identity Badge */}
                    {parsed.isStructured && (
                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">System Cross-Check</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${parsed.verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {parsed.verified ? 'IDENTITY MATCH' : 'DATA MISMATCH'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onVerify(doc.id); }}
                  className="flex-1 py-2.5 bg-success/20 hover:bg-success/30 border border-success/40 text-success rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_10px_rgba(7,202,107,0.3)] active:scale-95"
                >
                  Approve
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenRejectModal(doc); }}
                  className="flex-1 py-2.5 bg-danger/20 hover:bg-danger/30 border border-danger/40 text-danger rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_10px_rgba(234,33,67,0.3)] active:scale-95"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Preview Panel ── */}
        <div className="hidden lg:block lg:col-span-7 xl:col-span-8 p-8 overflow-hidden flex flex-col relative">
          <div className="flex items-center justify-between mb-6 flex-shrink-0 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-10">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-headline font-bold text-white drop-shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                {selectedDoc?.original_name || 'Document Viewer'}
              </h3>
              <div className="h-6 w-px bg-white/20 mx-2"></div>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 glass-surface hover:bg-white/20 rounded-lg transition-colors border border-white/10 text-white/70"><span className="material-symbols-outlined text-lg">zoom_in</span></button>
                <button className="p-1.5 glass-surface hover:bg-white/20 rounded-lg transition-colors border border-white/10 text-white/70"><span className="material-symbols-outlined text-lg">zoom_out</span></button>
                <button className="p-1.5 glass-surface hover:bg-white/20 rounded-lg transition-colors border border-white/10 text-white/70"><span className="material-symbols-outlined text-lg">rotate_right</span></button>
              </div>
            </div>
            <a 
              href={previewUrls[selectedDocId]} 
              download 
              className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span> Download
            </a>
          </div>

          <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/20 bg-black/40 group relative">
            {loadingPreview ? (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary drop-shadow-[0_0_15px_rgba(24,86,255,0.8)]">refresh</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-primary">Fetching preview...</span>
                </div>
              </div>
            ) : previewUrls[selectedDocId] ? (
              <iframe 
                src={previewUrls[selectedDocId]} 
                className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity"
                title="Document Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 italic font-medium">
                No document preview available.
              </div>
            )}
            
            {/* AI Data Overlay Mockup Layer */}
            {selectedDoc?.status === 'verified' && !loadingPreview && previewUrls[selectedDocId] && (
              <div className="absolute inset-0 pointer-events-none p-12 mix-blend-screen">
                <div className="w-1/3 h-12 border border-success/60 bg-success/10 absolute top-1/4 left-1/4 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(7,202,107,0.3)]">
                  <span className="bg-success text-white text-[9px] font-bold px-1.5 py-0.5 absolute -top-3 left-2 rounded uppercase tracking-wider drop-shadow-md">Name_Match</span>
                </div>
                <div className="w-1/4 h-8 border border-success/60 bg-success/10 absolute top-[45%] left-1/2 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(7,202,107,0.3)]">
                  <span className="bg-success text-white text-[9px] font-bold px-1.5 py-0.5 absolute -top-3 left-2 rounded uppercase tracking-wider drop-shadow-md">Exp_Date</span>
                </div>
              </div>
            )}

            {/* Floating Glass Actions */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl glass-elevated border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <button className="px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">first_page</span> Prev
              </button>
              <div className="px-4 py-2 border-x border-white/20 text-[10px] font-bold text-white/60 font-mono uppercase tracking-widest">
                1 of 1 Pgs
              </div>
              <button className="px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 uppercase tracking-widest">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 glass-animate-in">
          <div className="glass-elevated border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-danger font-bold drop-shadow-[0_0_5px_rgba(234,33,67,0.5)]">
                    <span className="material-symbols-outlined">report</span>
                    <span className="text-[10px] tracking-[0.2em] uppercase">Action Required</span>
                  </div>
                  <h2 className="text-3xl font-headline font-extrabold tracking-tight text-white">Reject Document</h2>
                  <p className="text-sm text-white/60 leading-relaxed">
                    You are rejecting <strong className="text-white">{docToReject?.doc_type.replace('_', ' ')}</strong>. Please provide a clear reason for the candidate to address.
                  </p>
                </div>
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full glass-surface hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="material-symbols-outlined text-white">close</span>
                </button>
              </div>
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] ml-1">Reason for Rejection</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full glass-surface border border-white/20 rounded-2xl p-5 text-sm text-white focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20 outline-none" 
                  placeholder="e.g., The scan is blurry and the expiration date is not legible..." 
                  rows="4"
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim()}
                  className="w-full py-4 bg-danger hover:bg-danger/90 text-white rounded-2xl font-headline font-bold text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(234,33,67,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Send Re-upload Request
                </button>
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="w-full py-4 text-white/60 font-bold text-xs tracking-widest uppercase hover:text-white hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="bg-primary/5 border-t border-primary/20 px-8 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]" style={{fontVariationSettings: "'FILL' 1"}}>info</span>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Candidate will receive an automated notification.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Toast ── */}
      {showSuccessToast && (
        <div className="fixed top-24 right-8 z-[70] glass-animate-in">
          <div className="flex items-center gap-4 p-4 glass-elevated shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl border border-success/30 min-w-[320px]">
            <div className="flex-shrink-0 w-12 h-12 bg-success/20 border border-success/40 text-success rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(7,202,107,0.3)]">
              <span className="material-symbols-outlined">send</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-success uppercase tracking-widest">Success</p>
              <p className="text-[11px] text-white/70 mt-1">Rejection email sent to user via Azure Comm Services.</p>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg glass-surface hover:bg-white/10 text-white/50 hover:text-white"
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
