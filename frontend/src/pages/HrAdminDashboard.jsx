import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Avatar from '../components/Avatar';

const HrAdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [uData, dData] = await Promise.all([
        api('/users'),
        api('/documents'),
      ]);
      setUsers(uData.users);
      setDocuments(dData.documents);
    } catch (err) {
      console.error('HR Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-on-surface-variant">Loading analytics...</div>;

  const totalDocs = documents.length;
  const verifiedDocs = documents.filter(d => d.status === 'verified').length;
  const pendingDocs = documents.filter(d => d.status === 'pending').length;
  const uploadedDocs = documents.filter(d => d.status === 'uploaded' || d.status === 'ai_processing').length;
  const rejectedDocs = documents.filter(d => d.status === 'rejected').length;
  const newHires = users.filter(u => u.role === 'NEW_HIRE');
  const completionRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

  const statCards = [
    { label: 'Total Employees', value: users.length, icon: 'groups', color: 'bg-blue-500' },
    { label: 'Active New Hires', value: newHires.length, icon: 'person_add', color: 'bg-emerald-500' },
    { label: 'Documents Verified', value: verifiedDocs, icon: 'verified', color: 'bg-green-500' },
    { label: 'Pending Review', value: pendingDocs + uploadedDocs, icon: 'pending_actions', color: 'bg-amber-500' },
    { label: 'Rejected', value: rejectedDocs, icon: 'cancel', color: 'bg-red-500' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: 'trending_up', color: 'bg-violet-500' },
  ];

  return (
    <div className="pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-light text-on-surface mb-2">HR Administration</h1>
        <p className="text-on-surface-variant">
          Organization-wide onboarding analytics and team management.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/15 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-on-surface">{card.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/15">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Employee Directory</h3>
          </div>
          <div className="divide-y divide-outline-variant/15">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{u.name || 'Unknown'}</p>
                    <p className="text-xs text-on-surface-variant">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    u.role === 'NEW_HIRE' ? 'bg-blue-100 text-blue-700' :
                    u.role === 'HR_ADMIN' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'HR_REVIEWER' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/15">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Document Pipeline</h3>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {[
                { label: 'Verified', count: verifiedDocs, total: totalDocs, color: 'bg-green-500' },
                { label: 'In Processing', count: uploadedDocs, total: totalDocs, color: 'bg-blue-500' },
                { label: 'Pending Upload', count: pendingDocs, total: totalDocs, color: 'bg-amber-500' },
                { label: 'Rejected', count: rejectedDocs, total: totalDocs, color: 'bg-red-500' },
              ].map((stage) => (
                <div key={stage.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-on-surface">{stage.label}</span>
                    <span className="text-xs text-on-surface-variant font-mono">{stage.count} / {stage.total}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-700`}
                      style={{ width: stage.total > 0 ? `${(stage.count / stage.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/15">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Recent Documents</h4>
              <div className="space-y-3">
                {documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        doc.status === 'verified' ? 'bg-green-500' :
                        doc.status === 'rejected' ? 'bg-red-500' :
                        doc.status === 'uploaded' || doc.status === 'ai_processing' ? 'bg-blue-500' :
                        'bg-amber-500'
                      }`}></span>
                      <span className="text-on-surface capitalize">{doc.doc_type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant capitalize">{doc.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrAdminDashboard;
