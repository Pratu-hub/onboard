import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const HrReviewerDashboard = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const updateStatus = async (id, status) => {
    try {
      await api(`/documents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-on-surface-variant">Loading cases...</div>;
  if (error) return <div className="p-8 text-on-surface-variant text-red-500">Error: {error}</div>;

  return (
    <div className="pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-light text-on-surface mb-2">Pending Document Reviews</h1>
        <p className="text-on-surface-variant">
          Review and verify uploaded identity and compliance documents.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/15 bg-surface-container-low/30">
                <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Candidate</th>
                <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Document Type</th>
                <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Filename</th>
                <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 px-6 text-center text-on-surface-variant">
                    No documents pending review.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-on-surface">{doc.user_name}</div>
                      <div className="text-xs text-on-surface-variant">{doc.user_email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface-variant border border-outline-variant/30 capitalize">
                        {doc.doc_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-on-surface-variant truncate max-w-[200px]" title={doc.original_name || doc.filename || 'N/A'}>
                      {doc.original_name || doc.filename || 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {doc.status === 'verified' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                        {doc.status === 'rejected' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                        {doc.status === 'uploaded' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        {(doc.status === 'pending' || doc.status === 'ai_processing') && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                        <span className="capitalize">{doc.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {doc.status !== 'verified' && doc.status !== 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(doc.id, 'verified')}
                            className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                            title="Verify"
                          >
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          </button>
                          <button 
                            onClick={() => updateStatus(doc.id, 'rejected')}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Reject"
                          >
                            <span className="material-symbols-outlined text-[20px]">cancel</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HrReviewerDashboard;
