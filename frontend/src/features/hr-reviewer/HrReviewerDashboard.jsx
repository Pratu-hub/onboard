import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import PendingCasesList from './components/PendingCasesList';
import CaseDetailView from './components/CaseDetailView';
import AuditLogView from './components/AuditLogView';

const HrReviewerDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('LIST'); // LIST, DETAIL, AUDIT
  const [selectedCase, setSelectedCase] = useState(null);
  const [documentToReject, setDocumentToReject] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api('/documents');
      setDocuments(data.documents);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId) => {
    try {
      await api(`/documents/${docId}/status`, {
        method: 'PATCH',
        body: { status: 'verified' }
      });
      
      // Update local state for immediate feedback
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'verified' } : d));
      
      // Update selectedCase if we are in detail view
      if (selectedCase) {
        setSelectedCase(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'verified' } : d)
        }));
      }
    } catch (err) {
      alert('Failed to verify document');
    }
  };

  const handleReject = async (docId, notes) => {
    try {
      await api(`/documents/${docId}/status`, {
        method: 'PATCH',
        body: { status: 'rejected', notes }
      });
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'rejected', reviewer_notes: notes } : d));
      
      if (selectedCase) {
        setSelectedCase(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'rejected', reviewer_notes: notes } : d)
        }));
      }
      setActiveView('DETAIL');
    } catch (err) {
      alert('Failed to reject document');
    }
  };

  const handleApproveAll = async () => {
    if (!selectedCase) return;
    const pendingDocs = selectedCase.documents.filter(d => ['pending', 'uploaded', 'ai_processing', 'flagged'].includes(d.status));
    
    if (pendingDocs.length === 0) {
      alert('All documents are already verified.');
      return;
    }

    if (!confirm(`Are you sure you want to approve all ${pendingDocs.length} pending documents for ${selectedCase.user_name}?`)) return;

    try {
      await Promise.all(pendingDocs.map(d => 
        api(`/documents/${d.id}/status`, {
          method: 'PATCH',
          body: { status: 'verified' }
        })
      ));
      
      const docIds = pendingDocs.map(d => d.id);
      setDocuments(prev => prev.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d));
      
      setSelectedCase(prev => ({
        ...prev,
        documents: prev.documents.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d)
      }));
      
      alert('Successfully approved all documents.');
    } catch (err) {
      alert('Failed to approve some documents.');
      fetchDocuments();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <p className="font-headline font-bold text-on-surface-variant uppercase tracking-widest text-xs">Loading Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fdf8f6] min-h-screen font-body text-on-surface">
      {/* ── Side Nav Placeholder (Matches design layout) ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-slate-50 flex flex-col py-6 z-50">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold tracking-tighter text-primary">OnboardIQ</h1>
          <p className="text-xs font-headline font-semibold text-slate-500 uppercase tracking-widest mt-1">HR Intelligence</p>
        </div>
        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveView('LIST')}
            className={`w-full flex items-center px-6 py-3 transition-colors duration-200 font-headline tracking-tight font-semibold ${activeView === 'LIST' ? 'text-primary border-r-4 border-primary bg-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className="material-symbols-outlined mr-3">assignment_late</span>
            Pending Cases
          </button>
          <button className="w-full flex items-center px-6 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 font-headline tracking-tight font-semibold">
            <span className="material-symbols-outlined mr-3">rate_review</span>
            My Reviews
          </button>
        </nav>
        <div className="px-6 pt-6 mt-auto border-t border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold">AR</div>
            <div>
              <p className="text-xs font-bold text-on-surface">Alex Rivera</p>
              <p className="text-[10px] text-on-surface-variant">Senior HR Lead</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Canvas ── */}
      <main className="ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex justify-between items-center w-full px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-primary">
                <span className="material-symbols-outlined text-sm">search</span>
              </span>
              <input 
                className="block w-full pl-10 pr-3 py-2 border-none bg-surface-container-low rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                placeholder="Search hire or case ID..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-6 text-slate-600">
            <button className="hover:text-primary transition-all"><span className="material-symbols-outlined">notifications</span></button>
            <button className="hover:text-primary transition-all"><span className="material-symbols-outlined">help_outline</span></button>
          </div>
        </header>

        {/* View Port */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'LIST' && (
            <div className="p-8 h-full overflow-y-auto">
              <PendingCasesList 
                documents={documents} 
                onCaseSelect={(c) => {
                  setSelectedCase(c);
                  setActiveView('DETAIL');
                }} 
              />
            </div>
          )}

          {activeView === 'DETAIL' && selectedCase && (
            <CaseDetailView 
              currentCase={selectedCase}
              onBack={() => setActiveView('LIST')}
              onVerify={handleVerify}
              onRejectInit={(doc) => {
                setDocumentToReject(doc);
                setActiveView('AUDIT');
              }}
              onApproveAll={handleApproveAll}
            />
          )}

          {activeView === 'AUDIT' && documentToReject && (
            <div className="p-8 h-full overflow-y-auto">
              <AuditLogView 
                document={documentToReject}
                onBack={() => setActiveView('DETAIL')}
                onSubmit={(notes) => handleReject(documentToReject.id, notes)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HrReviewerDashboard;
