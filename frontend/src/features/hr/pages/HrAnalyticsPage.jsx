import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const HrAnalyticsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
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
    <div className="p-8 pb-20 text-white font-body glass-animate-in">
      
      {/* Analytics Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-3xl tracking-tight mb-2 drop-shadow-sm">Analytics Engine</h2>
          <p className="text-white/60 max-w-2xl text-sm leading-relaxed">Enterprise-grade visibility into HR operations, document verification bottlenecks, and IT provisioning pipelines.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass-surface border border-white/10 rounded-xl text-sm font-bold text-white/80 flex items-center gap-2 hover:bg-white/10 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(24,86,255,0.4)]">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Generate Report
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main KPI / Line Chart Card (Spans 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative flex flex-col overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-1 drop-shadow-sm">Time to Verification</h3>
              <p className="text-[10px] font-medium text-white/50">Average days from document upload to HR approval</p>
            </div>
            <select className="glass-surface text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl border border-white/10 focus:ring-1 focus:ring-primary/50 outline-none cursor-pointer [color-scheme:dark]">
              <option className="bg-slate-900">Last 30 Days</option>
              <option className="bg-slate-900">This Quarter</option>
              <option className="bg-slate-900">Year to Date</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[220px] flex items-end justify-between gap-2 mt-auto border-b border-white/10 pb-2 relative z-10">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-white/[0.05] border-dashed"></div>
              <div className="w-full border-t border-white/[0.05] border-dashed"></div>
              <div className="w-full border-t border-white/[0.05] border-dashed"></div>
              <div className="w-full border-t border-white/[0.05] border-dashed"></div>
            </div>

            {/* Simulated Line Chart Data */}
            {[45, 60, 35, 80, 55, 90, 40, 70, 30, 65, 50, 75, 45, 85].map((h, i) => (
              <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group cursor-crosshair border-t border-primary/50 hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }}>
                <div className="absolute top-0 left-0 w-full h-px bg-primary shadow-[0_0_8px_rgba(24,86,255,1)]"></div>
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass-elevated text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none font-bold">
                  Day {i+1}: {Math.round(h / 10)} hrs
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] font-bold text-white/40 uppercase tracking-widest relative z-10">
            <span>Oct 1</span>
            <span>Oct 8</span>
            <span>Oct 15</span>
            <span>Oct 22</span>
            <span>Oct 29</span>
          </div>
        </div>

        {/* Donut Chart Card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-danger/10 rounded-full blur-[50px] pointer-events-none -ml-20 -mb-20"></div>
          
          <div className="mb-8 relative z-10">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-1 drop-shadow-sm">Rejection Causes</h3>
            <p className="text-[10px] font-medium text-white/50">Distribution of flagged document reasons</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            {/* CSS Donut Chart Mock */}
            <div className="relative w-44 h-44 rounded-full border-[18px] border-white/5 flex items-center justify-center mb-8 drop-shadow-lg">
              <div className="absolute inset-0 rounded-full border-[18px] border-primary/80 shadow-[0_0_15px_rgba(24,86,255,0.4)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
              <div className="absolute inset-0 rounded-full border-[18px] border-danger/80 shadow-[0_0_15px_rgba(234,33,67,0.4)]" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}></div>
              <div className="absolute inset-0 rounded-full border-[18px] border-info/80 shadow-[0_0_15px_rgba(56,189,248,0.4)]" style={{ clipPath: 'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)' }}></div>
              
              <div className="text-center glass-surface w-24 h-24 rounded-full flex flex-col items-center justify-center border border-white/10">
                <span className="block text-3xl font-extrabold text-white drop-shadow-sm">34</span>
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-[0.2em] mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3 px-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(24,86,255,0.8)]"></span>
                  <span className="font-medium text-white/70">Illegible / Blurry</span>
                </div>
                <span className="font-bold text-white font-mono">50%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(234,33,67,0.8)]"></span>
                  <span className="font-medium text-white/70">Expired ID</span>
                </div>
                <span className="font-bold text-white font-mono">25%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-info shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
                  <span className="font-medium text-white/70">Missing Pages</span>
                </div>
                <span className="font-bold text-white font-mono">25%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Bar Chart: Department Volume */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-1 drop-shadow-sm">Onboarding Volume by Dept</h3>
          </div>
          <div className="flex-1 flex flex-col justify-end gap-5 min-h-[160px]">
            {[
              { label: 'Engineering', value: 85, color: 'bg-primary shadow-[0_0_8px_rgba(24,86,255,0.8)]' },
              { label: 'Sales', value: 60, color: 'bg-success shadow-[0_0_8px_rgba(7,202,107,0.8)]' },
              { label: 'Marketing', value: 35, color: 'bg-info shadow-[0_0_8px_rgba(56,189,248,0.8)]' },
              { label: 'Operations', value: 45, color: 'bg-warning shadow-[0_0_8px_rgba(255,170,0,0.8)]' },
              { label: 'HR', value: 15, color: 'bg-white/40' },
            ].map(dept => (
              <div key={dept.label} className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-white/50 w-24 text-right uppercase tracking-wider">{dept.label}</span>
                <div className="flex-1 h-2.5 glass-surface border border-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color} rounded-full`} style={{ width: `${dept.value}%` }}></div>
                </div>
                <span className="text-xs font-bold text-white w-8 font-mono">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights Text Blocks */}
        <div className="glass-panel border-primary/30 bg-primary/5 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[60px] pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6 text-info">
              <span className="material-symbols-outlined text-2xl drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">auto_awesome</span>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">AI Intelligence Brief</h3>
            </div>
            <div className="space-y-6">
              <div className="glass-surface p-4 rounded-xl border border-white/10">
                <p className="text-sm leading-relaxed text-white/80">
                  <span className="font-bold text-white">Engineering</span> department is experiencing a <span className="text-warning font-bold drop-shadow-[0_0_5px_rgba(255,170,0,0.5)]">12% slower</span> verification time due to a high volume of complex visa documentation.
                </p>
              </div>
              <div className="glass-surface p-4 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-success/5"></div>
                <p className="text-sm leading-relaxed text-white/80 relative z-10">
                  AI auto-verification successfully handled <span className="text-success font-bold text-base drop-shadow-[0_0_5px_rgba(7,202,107,0.5)]">78%</span> of all standard identity documents this week, saving approximately <span className="font-bold text-white">42 hours</span> of manual review.
                </p>
              </div>
            </div>
          </div>
          <button className="mt-8 w-full py-3.5 glass-surface hover:bg-white/10 transition-colors rounded-xl text-xs uppercase tracking-[0.2em] font-bold border border-white/20 text-white relative z-10">
            View Full AI Report
          </button>
        </div>

      </div>

      {/* Recent Audit Log */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-white/[0.08] flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] drop-shadow-sm">Provisioning Audit Log</h3>
            <p className="text-[10px] font-medium text-white/50 mt-1">Real-time system actions and HR overrides</p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">View All →</button>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="p-16 flex flex-col items-center justify-center space-y-4">
               <span className="material-symbols-outlined animate-spin text-primary text-4xl drop-shadow-[0_0_15px_rgba(24,86,255,0.8)]">sync</span>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Action / Event</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Actor</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Target</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.04] transition-colors text-sm group">
                    <td className="px-6 py-4 text-white/50 font-mono text-[11px]">
                      {new Date(log.updated_at || log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white group-hover:text-primary transition-colors">
                      Document {log.status === 'verified' ? 'Verified' : log.status === 'rejected' ? 'Rejected' : 'Flagged'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-info/20 border border-info/30 flex items-center justify-center text-info">
                          <span className="material-symbols-outlined text-[16px]">robot_2</span>
                        </div>
                        <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">System AI</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      User {log.user_id} - {log.doc_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'verified' ? (
                        <span className="badge-success px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">SUCCESS</span>
                      ) : (
                        <span className="badge-warning px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">MANUAL REQ</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-white/40 text-sm italic">No recent activity found.</td>
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
