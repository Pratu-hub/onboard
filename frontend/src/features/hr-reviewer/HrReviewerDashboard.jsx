import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import PendingCasesList from './components/PendingCasesList';
import CaseDetailView from './components/CaseDetailView';
import AuditLogView from './components/AuditLogView';

const HrReviewerDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeView, setActiveView] = useState('LIST'); // 'LIST' | 'DETAIL' | 'AUDIT'
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await api('/documents');
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, metadata = {}) => {
    try {
      await api(`/documents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...metadata }),
      });
      await fetchDocuments();
      setActiveView('LIST');
      setSelectedCase(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-[#1c1b1b]/70 bg-[#fdf8f6] min-h-screen">Loading cases...</div>;
  if (error) return <div className="p-8 text-[#ba1a1a] bg-[#fdf8f6] min-h-screen">Error: {error}</div>;

  return (
    <div className="bg-[#fdf8f6] min-h-screen pb-12 font-sans px-8 py-8">
      {activeView === 'LIST' && (
        <PendingCasesList 
          documents={documents} 
          onCaseSelect={(doc) => {
            setSelectedCase(doc);
            setActiveView('DETAIL');
          }} 
        />
      )}

      {activeView === 'DETAIL' && (
        <CaseDetailView 
          document={selectedCase} 
          onBack={() => {
            setActiveView('LIST');
            setSelectedCase(null);
          }}
          onVerify={(id) => updateStatus(id, 'verified')}
          onRejectInit={() => setActiveView('AUDIT')}
        />
      )}

      {activeView === 'AUDIT' && (
        <AuditLogView 
          document={selectedCase} 
          onBack={() => setActiveView('DETAIL')}
          onSubmitReject={(id, reason) => updateStatus(id, 'rejected', { rejection_reason: reason })}
        />
      )}
    </div>
  );
};

export default HrReviewerDashboard;
