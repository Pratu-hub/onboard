import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import PendingCasesList from './components/PendingCasesList';
import CaseDetailView from './components/CaseDetailView';

const HrReviewerDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('LIST'); // LIST, DETAIL
  const [selectedCase, setSelectedCase] = useState(null);

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
      
      // Update local flat list
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
        body: { status: 'rejected', reviewer_notes: notes }
      });
      
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'rejected', reviewer_notes: notes } : d));
      
      if (selectedCase) {
        setSelectedCase(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'rejected', reviewer_notes: notes } : d)
        }));
      }
    } catch (err) {
      alert('Failed to reject document');
      throw err; // Re-throw so CaseDetailView can handle UI state if needed
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
    <div className="bg-surface h-screen flex overflow-hidden font-body text-on-surface">
      {/* ── Side NavBar (Stitch Mockup Design) ── */}
      <aside className="flex flex-col h-full py-6 bg-slate-50 w-64 border-r border-slate-200 z-50">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-primary">OnboardIQ</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-headline">HR Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveView('LIST')}
            className={`w-full flex items-center px-6 py-3 font-headline tracking-tight font-semibold transition-colors duration-200 ${activeView === 'LIST' ? 'text-primary border-r-4 border-primary bg-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className="material-symbols-outlined mr-3">assignment_late</span>
            <span>Pending Cases</span>
          </button>
          <button className="w-full flex items-center px-6 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 font-headline tracking-tight font-semibold">
            <span className="material-symbols-outlined mr-3">rate_review</span>
            <span>My Reviews</span>
          </button>
        </nav>
        <div className="px-6 mt-auto">
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs font-bold text-primary mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">Azure Services Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Canvas ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface h-full">
        {/* TopNavBar (Stitch Mockup Design) */}
        <header className="flex justify-between items-center w-full px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-primary/20 transition-all rounded-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                className="w-full bg-surface-container-high border-none rounded-full py-2 pl-10 pr-4 text-xs focus:ring-0" 
                placeholder="Search case ID, candidate, or document..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-slate-600">
              <button className="hover:text-primary transition-all"><span className="material-symbols-outlined">notifications</span></button>
              <button className="hover:text-primary transition-all"><span className="material-symbols-outlined">help_outline</span></button>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-on-surface leading-none text-sm">Sarah Jenkins</p>
                <p className="text-[10px] text-on-surface-variant font-medium">Senior HR Auditor</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-primary/10 bg-primary-container flex items-center justify-center text-white font-bold text-sm shadow-sm">
                SJ
              </div>
            </div>
          </div>
        </header>

        {/* View Port */}
        <div className="flex-1 overflow-hidden relative">
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
              onReject={handleReject}
              onApproveAll={handleApproveAll}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default HrReviewerDashboard;
