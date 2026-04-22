import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const HrAnalyticsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // We can fetch system audit logs or recent documents to simulate the audit table
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Reusing the documents endpoint to simulate recent activities for the audit log
      const data = await api('/documents');
      const recentDocs = data.documents
        .filter(d => d.status !== 'pending')
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 10);
      setLogs(recentDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 pb-20">
      
      {/* Analytics Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-2">Analytics Engine</h2>
          <p className="text-on-surface-variant max-w-2xl">Enterprise-grade visibility into HR operations, document verification bottlenecks, and IT provisioning pipelines.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Generate Report
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main KPI / Line Chart Card (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Time to Verification</h3>
              <p className="text-[10px] font-medium text-slate-500">Average days from document upload to HR approval</p>
            </div>
            <select className="bg-surface-container-low text-xs font-bold py-1.5 px-3 rounded-lg border-none focus:ring-0 cursor-pointer">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[200px] flex items-end justify-between gap-2 mt-auto border-b border-slate-100 pb-2 relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-slate-100 border-dashed"></div>
              <div className="w-full border-t border-slate-100 border-dashed"></div>
              <div className="w-full border-t border-slate-100 border-dashed"></div>
              <div className="w-full border-t border-slate-100 border-dashed"></div>
            </div>

            {/* Simulated Line Chart Data */}
            {[45, 60, 35, 80, 55, 90, 40, 70, 30, 65, 50, 75, 45, 85].map((h, i) => (
              <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group cursor-crosshair" style={{ height: `${h}%` }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                  Day {i+1}: {Math.round(h / 10)} hrs
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
            <span>Oct 1</span>
            <span>Oct 8</span>
            <span>Oct 15</span>
            <span>Oct 22</span>
            <span>Oct 29</span>
          </div>
        </div>

        {/* Donut Chart Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Rejection Causes</h3>
            <p className="text-[10px] font-medium text-slate-500">Distribution of flagged document reasons</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* CSS Donut Chart Mock */}
            <div className="relative w-40 h-40 rounded-full border-[16px] border-surface-container flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-[16px] border-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-error" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-tertiary" style={{ clipPath: 'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)' }}></div>
              
              <div className="text-center">
                <span className="block text-2xl font-bold text-on-surface">34</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="font-semibold text-slate-600">Illegible / Blurry</span>
                </div>
                <span className="font-bold text-slate-800">50%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="font-semibold text-slate-600">Expired ID</span>
                </div>
                <span className="font-bold text-slate-800">25%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span className="font-semibold text-slate-600">Missing Pages</span>
                </div>
                <span className="font-bold text-slate-800">25%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Bar Chart: Department Volume */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Onboarding Volume by Dept</h3>
          </div>
          <div className="flex-1 flex flex-col justify-end gap-3 min-h-[150px]">
            {[
              { label: 'Engineering', value: 85, color: 'bg-primary' },
              { label: 'Sales', value: 60, color: 'bg-secondary' },
              { label: 'Marketing', value: 35, color: 'bg-tertiary' },
              { label: 'Operations', value: 45, color: 'bg-primary/60' },
              { label: 'HR', value: 15, color: 'bg-slate-300' },
            ].map(dept => (
              <div key={dept.label} className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 w-20 text-right">{dept.label}</span>
                <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color} rounded-full`} style={{ width: `${dept.value}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-700 w-8">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights Text Blocks */}
        <div className="bg-gradient-to-br from-[#001c38] to-[#003366] rounded-xl p-6 shadow-sm text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#a2c9ff]">
              <span className="material-symbols-outlined">auto_awesome</span>
              <h3 className="text-sm font-bold uppercase tracking-widest">AI Intelligence Brief</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/90">
                <span className="font-bold text-white">Engineering</span> department is experiencing a <span className="text-[#a2c9ff] font-bold">12% slower</span> verification time due to a high volume of complex visa documentation.
              </p>
              <div className="w-full h-px bg-white/10"></div>
              <p className="text-sm leading-relaxed text-white/90">
                AI auto-verification successfully handled <span className="text-green-400 font-bold">78%</span> of all standard identity documents this week, saving approximately 42 hours of manual review.
              </p>
            </div>
          </div>
          <button className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-bold border border-white/20">
            View Full AI Report
          </button>
        </div>

      </div>

      {/* Recent Audit Log */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Provisioning Audit Log</h3>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Real-time system actions and HR overrides</p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-slate-400"><span className="material-symbols-outlined animate-spin">sync</span></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Timestamp</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Action / Event</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actor</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Target</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                    <td className="px-6 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.updated_at || log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-700">
                      Document {log.status === 'verified' ? 'Verified' : log.status === 'rejected' ? 'Rejected' : 'Flagged'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-slate-400">robot_2</span>
                        <span className="text-xs font-bold text-slate-600">System AI</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      User {log.user_id} - {log.doc_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {log.status === 'verified' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700">SUCCESS</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-error-container text-on-error-container">MANUAL REQ</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-sm">No recent activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default HrAnalyticsPage;
