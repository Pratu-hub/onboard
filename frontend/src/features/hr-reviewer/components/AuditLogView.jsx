import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const AuditLogView = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchLogs();
    }
  }, [isOpen, userId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api(`/documents/cases/${userId}/logs`);
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
           ' - ' + 
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadge = (type) => {
    const t = type.toUpperCase();
    if (t === 'VERIFIED') return <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-bold text-[10px]">VERIFIED</span>;
    if (t === 'REJECTED') return <span className="px-2 py-1 rounded bg-error-container text-on-error-container font-bold text-[10px]">REJECTED</span>;
    if (t === 'FLAGGED') return <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">FLAGGED</span>;
    if (t === 'UPLOADED') return <span className="px-2 py-1 rounded bg-surface-variant text-on-surface-variant font-bold text-[10px]">UPLOADED</span>;
    return <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-bold text-[10px]">{t}</span>;
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 z-30 pointer-events-none">
      <div className="max-w-6xl mx-auto px-8 pointer-events-auto">
        <div className={`glass-panel rounded-t-2xl shadow-2xl border border-outline-variant/30 overflow-hidden transition-all duration-300 ${isOpen ? 'h-80' : 'h-14'}`}>
          {/* Toggle Header */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex justify-between items-center px-8 py-4 bg-white/50 cursor-pointer hover:bg-white/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history</span>
              <h4 className="text-sm font-headline font-extrabold tracking-tight">Audit Log</h4>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                {logs.length} Events
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-xs font-bold text-primary hover:underline">Export CSV</button>
              <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                keyboard_arrow_up
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-y-auto h-full pb-14">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant italic text-sm">
                No history recorded for this case yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <tr>
                    <th className="px-8 py-3">Timestamp</th>
                    <th className="px-4 py-3">Reviewer / System</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-8 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-outline-variant/10">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-primary-fixed-dim/5 transition-colors">
                      <td className="px-8 py-4 font-medium text-slate-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold">{log.reviewer_name || 'System'}</span>
                      </td>
                      <td className="px-4 py-4">
                        {getActionBadge(log.action_type)}
                      </td>
                      <td className="px-8 py-4 text-on-surface-variant">
                        {log.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
