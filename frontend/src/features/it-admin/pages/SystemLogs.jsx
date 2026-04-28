import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const SystemLogs = () => {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTelemetry();
    // Poll every 10 seconds for updated telemetry
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const data = await api('/system/telemetry');
      setTelemetry(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLogLevelClass = (level) => {
    switch (level) {
      case 'ERR': return 'text-danger font-bold';
      case 'WARN': return 'text-warning';
      case 'INFO': return 'text-info';
      default: return 'text-white/50';
    }
  };

  const metrics = telemetry?.metrics || { apiLatency: 0, authErrors: '0.0', activeNodes: 0, criticalAlerts: 0 };
  const logs = telemetry?.logs || [];

  return (
    <div className="glass-animate-in text-white/90 font-body">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
            <span>Infrastructure</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]">Telemetry</span>
          </nav>
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-white drop-shadow-sm flex items-center gap-4">
            System Logs & Alerts
            <span className="inline-flex h-3 w-3 relative ml-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${error ? 'bg-danger' : 'bg-success'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${error ? 'bg-danger' : 'bg-success'}`}></span>
            </span>
          </h2>
          <p className="text-white/60 max-w-lg font-medium text-sm leading-relaxed mt-2">
            Real-time cluster diagnostics, authentication telemetry, and infrastructure health monitoring.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest border border-white/10 transition-all">
            <span className="material-symbols-outlined text-base">download</span>
            Export Dump
          </button>
          <button onClick={fetchTelemetry} className="group flex items-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary px-5 py-3 rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest border border-primary/20 transition-all">
            <span className="material-symbols-outlined text-base">sync</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 glass-panel rounded-2xl border-l-2 border-l-success relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">API Latency</p>
              <span className="material-symbols-outlined text-success text-sm">speed</span>
            </div>
            <h3 className="text-2xl font-headline font-extrabold text-white">{loading ? '-' : `${metrics.apiLatency}ms`}</h3>
            <p className="text-[10px] text-white/40 mt-1 font-mono">p95 / Global</p>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-success/10 blur-[30px] rounded-full"></div>
        </div>
        
        <div className="p-6 glass-panel rounded-2xl border-l-2 border-l-warning relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Auth Errors</p>
              <span className="material-symbols-outlined text-warning text-sm">key_off</span>
            </div>
            <h3 className="text-2xl font-headline font-extrabold text-white">{loading ? '-' : `${metrics.authErrors}%`}</h3>
            <p className="text-[10px] text-white/40 mt-1 font-mono">Spike detected 10m ago</p>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-warning/10 blur-[30px] rounded-full"></div>
        </div>
        
        <div className="p-6 glass-panel rounded-2xl border-l-2 border-l-primary relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Active Nodes</p>
              <span className="material-symbols-outlined text-primary text-sm">dns</span>
            </div>
            <h3 className="text-2xl font-headline font-extrabold text-white">{loading ? '-' : `${metrics.activeNodes}/8`}</h3>
            <p className="text-[10px] text-white/40 mt-1 font-mono">Cluster-01 Healthy</p>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/10 blur-[30px] rounded-full"></div>
        </div>
        
        <div className="p-6 glass-panel rounded-2xl border-l-2 border-l-danger bg-danger/5 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-danger uppercase tracking-[0.2em] drop-shadow-[0_0_5px_rgba(234,33,67,0.5)]">Critical Alerts</p>
              <span className="material-symbols-outlined text-danger text-sm">notifications_active</span>
            </div>
            <h3 className="text-2xl font-headline font-extrabold text-white">{loading ? '-' : metrics.criticalAlerts.toString().padStart(2, '0')}</h3>
            <p className="text-[10px] text-danger/60 mt-1 font-mono uppercase tracking-widest">Awaiting Ack</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Terminal/Log Viewer */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
          <div className="p-4 border-b border-white/[0.05] bg-[#050508] flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 ml-2">
                <div className="w-3 h-3 rounded-full bg-danger border border-danger/50 shadow-[0_0_5px_rgba(234,33,67,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-warning border border-warning/50"></div>
                <div className="w-3 h-3 rounded-full bg-success border border-success/50"></div>
              </div>
              <div className="h-4 w-px bg-white/10 mx-2"></div>
              <span className="text-[10px] font-mono text-white/40">root@cluster-01:~</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-success uppercase tracking-widest px-2 py-1 bg-success/10 rounded border border-success/20">Live Stream</span>
            </div>
          </div>
          
          <div className="flex-1 bg-[#050508]/80 p-6 overflow-y-auto font-mono text-xs leading-relaxed space-y-2 text-white/70">
            {error && (
              <div className="flex gap-4 bg-danger/10 p-2 rounded border border-danger/30 text-danger mb-4">
                [SYSTEM FAULT] Connection to telemetry stream lost: {error}
              </div>
            )}
            
            {logs.map((log) => (
              <div key={log.id} className={`flex gap-4 p-1 rounded transition-colors ${log.level === 'ERR' ? 'bg-danger/10 border-l-2 border-danger' : 'hover:bg-white/[0.02]'}`}>
                <span className="text-white/30 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}</span>
                <span className={`${getLogLevelClass(log.level)} shrink-0 w-12`}>[{log.level}]</span>
                <span className="text-white/50 w-24 shrink-0">{log.service}</span>
                <span className={`break-all ${log.level === 'ERR' ? 'text-white/90' : ''}`}>{log.message}</span>
              </div>
            ))}
            
            <div className="flex items-center gap-2 mt-4 text-white/40">
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

        {/* Filters & Alerts Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl h-[280px] flex flex-col">
            <h4 className="font-headline font-bold text-sm text-white mb-4 uppercase tracking-widest text-white/50">Log Filters</h4>
            <div className="space-y-3 flex-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0" />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">Errors & Critical</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0" />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">Warnings</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0" />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">Info & Trace</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0" />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">Auth Events Only</span>
              </label>
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">search</span>
                <input 
                  type="text" 
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary/50 text-white outline-none placeholder:text-white/30" 
                  placeholder="Regex grep..." 
                />
              </div>
            </div>
          </div>
          
          {metrics.criticalAlerts > 0 && (
            <div className="glass-panel border-danger/20 bg-danger/5 p-6 rounded-3xl flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-danger/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(234,33,67,0.3)]">
                <span className="material-symbols-outlined text-danger">warning</span>
              </div>
              <h4 className="font-headline font-bold text-lg text-white mb-2">Active Incident</h4>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Database connection timeout to Replica-03 detected in recent telemetry. Manual inspection required to restore cluster parity.
              </p>
              <button className="w-full bg-danger hover:bg-danger/90 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(234,33,67,0.4)] transition-colors">
                Acknowledge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
