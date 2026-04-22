import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const CaseDetailView = ({ currentCase, onBack, onVerify, onRejectInit, onApproveAll }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [loadingPreview, setLoadingPreview] = useState(false);

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

  if (!currentCase) return null;

  const selectedDoc = currentCase.documents.find(d => d.id === selectedDocId) || currentCase.documents[0];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-tighter">Verified</span>;
      case 'flagged': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-tighter">Flagged</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-tighter">Rejected</span>;
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
    <div className="bg-[#fdf8f6] h-full flex flex-col">
      {/* ── Case Profile Ribbon ── */}
      <section className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/10">
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
                <h2 className="text-2xl font-headline font-extrabold tracking-tight text-on-surface">{currentCase.user_name}</h2>
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
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
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
                  onClick={(e) => { e.stopPropagation(); onRejectInit(doc); }}
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
    </div>
  );
};

export default CaseDetailView;
