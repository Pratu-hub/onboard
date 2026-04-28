import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';

const ProvisioningQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await api('/hardware');
      setRequests(data.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGroupStatus = async (group, newStatus) => {
    try {
      const targetItems = group.items.filter(item => {
        if (newStatus === 'approved') return item.status === 'pending';
        if (newStatus === 'shipping') return item.status === 'approved';
        if (newStatus === 'delivered') return item.status === 'shipping';
        return false;
      });

      await Promise.all(
        targetItems.map(item =>
          api(`/hardware/${item.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );

      // Refresh and reset selection
      const updatedData = await api('/hardware');
      setRequests(updatedData.requests);
      
      // Find matching updated group
      const newGroups = getGroupedData(updatedData.requests);
      const updatedGroup = newGroups.find(g => g.user_email === group.user_email);
      if (updatedGroup) setSelectedGroup(updatedGroup);
    } catch (err) {
      alert(err.message);
    }
  };

  const getDeviceIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'laptop': return 'laptop_mac';
      case 'monitor': return 'desktop_windows';
      case 'keyboard': return 'keyboard';
      case 'mouse': return 'mouse';
      case 'phone': return 'smartphone';
      default: return 'devices';
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered':
        return (
          <span className="badge-success px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 w-max">
            <span className="material-symbols-outlined text-[10px]">check_circle</span>
            Delivered
          </span>
        );
      case 'shipping':
        return (
          <span className="badge-info px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 w-max">
            <span className="material-symbols-outlined text-[10px]">local_shipping</span>
            In Transit
          </span>
        );
      case 'approved':
        return (
          <span className="badge-warning px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
            Configuring MDM
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="badge-danger px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 w-max">
            <span className="material-symbols-outlined text-[10px]">schedule</span>
            Awaiting Review
          </span>
        );
    }
  };

  const getStepStatus = (status, stepIndex) => {
    // Hardware Steps:
    // 0: Request & Budget Approval
    // 1: Inventory Sourcing
    // 2: Zero-Touch MDM Config
    // 3: Asset Tagging & Audit
    // 4: Dispatch & Logistics
    const statusLower = status?.toLowerCase();
    if (statusLower === 'delivered') return 'SUCCESS';
    
    if (statusLower === 'shipping') {
      if (stepIndex <= 3) return 'SUCCESS';
      if (stepIndex === 4) return 'ACTIVE';
      return 'PENDING';
    }
    
    if (statusLower === 'approved') {
      if (stepIndex <= 1) return 'SUCCESS';
      if (stepIndex === 2) return 'ACTIVE';
      return 'PENDING';
    }
    
    // pending
    if (stepIndex === 0) return 'SUCCESS';
    if (stepIndex === 1) return 'ACTIVE';
    return 'PENDING';
  };

  const getGroupedData = (reqs) => {
    const groups = {};
    reqs.forEach(req => {
      const key = req.user_email || req.user_id;
      if (!groups[key]) {
        groups[key] = {
          id: req.id,
          user_name: req.user_name,
          user_email: req.user_email,
          department: req.department,
          items: [],
          status: 'delivered'
        };
      }
      groups[key].items.push(req);
      if (req.id > groups[key].id) {
        groups[key].id = req.id;
      }
    });

    Object.values(groups).forEach(group => {
      const statuses = group.items.map(i => i.status.toLowerCase());
      if (statuses.includes('pending')) {
        group.status = 'pending';
      } else if (statuses.includes('approved')) {
        group.status = 'approved';
      } else if (statuses.includes('shipping')) {
        group.status = 'shipping';
      } else {
        group.status = 'delivered';
      }
    });

    return Object.values(groups);
  };

  const groupedRequests = useMemo(() => getGroupedData(requests), [requests]);

  const inTransitCount = groupedRequests.filter(g => g.status === 'shipping' || g.status === 'approved').length;
  const pendingCount = groupedRequests.filter(g => g.status === 'pending').length;

  return (
    <div className="glass-animate-in text-white/90 font-body relative">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
            <span>Hardware Ops</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]">Deployment</span>
          </nav>
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-white drop-shadow-sm">Provisioning Queue</h2>
          <p className="text-white/60 max-w-lg font-medium text-sm leading-relaxed mt-2">
            Monitor hardware fulfillment batches, execute asset allocations, and track employee equipment deployments.
          </p>
        </div>
        <button 
          onClick={fetchRequests}
          className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-headline font-bold text-xs uppercase tracking-widest border border-white/10 transition-all">
          <span className="material-symbols-outlined text-lg">sync</span>
          Sync Queue
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-8 glass-panel border border-white/5 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Active Deployments</p>
            <h3 className="text-4xl font-headline font-extrabold text-white">{loading ? '-' : inTransitCount}</h3>
            <div className="mt-4 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-primary">local_shipping</span>
              In Transit / Config
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full group-hover:bg-primary/30 transition-colors"></div>
        </div>
        
        <div className="p-8 glass-panel border border-white/5 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Pending Backlog</p>
            <h3 className="text-4xl font-headline font-extrabold text-white">{loading ? '-' : pendingCount}</h3>
            <div className="mt-4 flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Awaiting Approval
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-warning/10 blur-[50px] rounded-full group-hover:bg-warning/20 transition-colors"></div>
        </div>

        <div className="p-8 glass-panel border border-danger/20 rounded-3xl bg-danger/5 relative overflow-hidden group shadow-[0_0_20px_rgba(234,33,67,0.1)]">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-danger uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_5px_rgba(234,33,67,0.5)]">Hardware Exceptions</p>
            <h3 className="text-4xl font-headline font-extrabold text-white">0</h3>
            <div className="mt-4 flex items-center gap-2 text-danger font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Systems Nominal
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue Data Grid */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl mb-12">
        <div className="p-8 border-b border-white/[0.05] flex justify-between items-center glass-surface">
          <h4 className="font-headline font-bold text-lg text-white">Fulfillment Queue</h4>
          <div className="flex gap-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">search</span>
              <input 
                type="text" 
                className="w-48 bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary/50 text-white outline-none placeholder:text-white/30" 
                placeholder="Search requests..." 
              />
            </div>
            <button className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 transition-colors border border-transparent hover:border-white/10">
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-white/40 font-mono text-xs uppercase tracking-widest animate-pulse">Loading hardware requests...</div>
        ) : error ? (
          <div className="p-12 text-center text-danger font-mono text-xs uppercase tracking-widest">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 bg-white/[0.02]">
                  <th className="px-8 py-5">Employee</th>
                  <th className="px-8 py-5">Equipment Profile</th>
                  <th className="px-8 py-5">Aggregated Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {groupedRequests.map((group) => (
                  <tr 
                    key={group.user_email} 
                    onClick={() => setSelectedGroup(group)}
                    className={`group hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedGroup?.user_email === group.user_email ? 'bg-white/[0.04] border-l-2 border-primary' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                          {group.user_name ? group.user_name.split(' ').map(n=>n[0]).join('') : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{group.user_name}</p>
                          <p className="text-xs text-white/50 font-mono">{group.department || group.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {group.items.map(item => (
                          <div key={item.id} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-xs text-white/50">{getDeviceIcon(item.device_type)}</span>
                            <span className="text-[11px] font-medium text-white capitalize">{item.device_type}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(group.status)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {group.status === 'pending' && (
                          <button onClick={() => updateGroupStatus(group, 'approved')} className="px-3 py-1.5 text-[10px] font-bold text-warning border border-warning/30 hover:bg-warning/10 rounded transition-all uppercase tracking-widest">Approve All</button>
                        )}
                        {group.status === 'approved' && (
                          <button onClick={() => updateGroupStatus(group, 'shipping')} className="px-3 py-1.5 text-[10px] font-bold text-primary border border-primary/30 hover:bg-primary/10 rounded transition-all uppercase tracking-widest">Ship Bundle</button>
                        )}
                        {group.status === 'shipping' && (
                          <button onClick={() => updateGroupStatus(group, 'delivered')} className="px-3 py-1.5 text-[10px] font-bold text-success border border-success/30 hover:bg-success/10 rounded transition-all uppercase tracking-widest">Complete All</button>
                        )}
                        <button 
                          onClick={() => setSelectedGroup(group)}
                          className="px-3 py-1.5 text-[10px] font-bold text-white/50 border border-white/10 hover:bg-white/10 rounded transition-all uppercase tracking-widest">
                          Track
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {groupedRequests.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-12 text-center text-white/40 text-xs font-mono uppercase tracking-widest">
                      Queue is currently empty
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROVISIONING DETAIL OVERLAY / SLIDE-OUT DRAWER */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-end">
          {/* Content Container */}
          <div className="w-full max-w-md glass-elevated h-full shadow-2xl flex flex-col border-l border-white/10 bg-[#0a0a12]/95 text-white animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/[0.05] glass-surface">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lg">close</span> Close
                </button>
                <span className="px-3 py-1 bg-white/5 text-white/40 text-[9px] font-bold uppercase tracking-widest rounded border border-white/10">
                  Technical Ledger
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xl font-headline shadow-lg">
                  {selectedGroup.user_name ? selectedGroup.user_name.split(' ').map(n=>n[0]).join('') : 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-extrabold text-white leading-tight">{selectedGroup.user_name}</h2>
                  <p className="text-xs text-white/50 mt-1 font-mono">{selectedGroup.department || selectedGroup.user_email}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-white/5 border border-white/5 p-3 rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-1">Package IDs</p>
                  <p className="text-primary font-mono font-semibold text-[10px]">
                    {selectedGroup.items.map(i => `#REQ-${i.id.toString().padStart(3, '0')}`).join(', ')}
                  </p>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 p-3 rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-1">Current Phase</p>
                  <div className="text-white text-xs font-bold">
                    {selectedGroup.status?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Stepper Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative pl-8">
                {/* The Pipeline Line */}
                <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-white/10"></div>
                
                {/* Steps */}
                <div className="space-y-8 relative">
                  {/* Step 1: Budget & Approval */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-[25px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 ${
                      getStepStatus(selectedGroup.status, 0) === 'SUCCESS' ? 'bg-success shadow-[0_0_10px_rgba(7,202,107,0.5)]' : 
                      getStepStatus(selectedGroup.status, 0) === 'ACTIVE' ? 'bg-warning shadow-[0_0_10px_rgba(232,149,88,0.5)]' : 'bg-white/10'
                    }`}>
                      {getStepStatus(selectedGroup.status, 0) === 'SUCCESS' ? (
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      ) : '1'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">Request & Budget Approval</h4>
                      <p className="text-[11px] text-white/40 mt-1">Employee tier allocation validated against finance limits.</p>
                    </div>
                  </div>

                  {/* Step 2: Sourcing & Procurement */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-[25px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 ${
                      getStepStatus(selectedGroup.status, 1) === 'SUCCESS' ? 'bg-success shadow-[0_0_10px_rgba(7,202,107,0.5)]' : 
                      getStepStatus(selectedGroup.status, 1) === 'ACTIVE' ? 'bg-warning shadow-[0_0_10px_rgba(232,149,88,0.5)]' : 'bg-white/10'
                    }`}>
                      {getStepStatus(selectedGroup.status, 1) === 'SUCCESS' ? (
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      ) : '2'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">Inventory Sourcing</h4>
                      <p className="text-[11px] text-white/40 mt-1">Procured from internal stockroom or vendor order mapped.</p>
                    </div>
                  </div>

                  {/* Step 3: Zero-Touch MDM Config */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-[25px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 ${
                      getStepStatus(selectedGroup.status, 2) === 'SUCCESS' ? 'bg-success shadow-[0_0_10px_rgba(7,202,107,0.5)]' : 
                      getStepStatus(selectedGroup.status, 2) === 'ACTIVE' ? 'bg-warning shadow-[0_0_10px_rgba(232,149,88,0.5)] animate-pulse' : 'bg-white/10'
                    }`}>
                      {getStepStatus(selectedGroup.status, 2) === 'SUCCESS' ? (
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      ) : '3'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">Zero-Touch Configuration</h4>
                      <p className="text-[11px] text-white/40 mt-1">MDM registration (Jamf/Intune) executed for endpoint security.</p>
                    </div>
                  </div>

                  {/* Step 4: Asset Tagging */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-[25px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 ${
                      getStepStatus(selectedGroup.status, 3) === 'SUCCESS' ? 'bg-success shadow-[0_0_10px_rgba(7,202,107,0.5)]' : 
                      getStepStatus(selectedGroup.status, 3) === 'ACTIVE' ? 'bg-warning shadow-[0_0_10px_rgba(232,149,88,0.5)] animate-pulse' : 'bg-white/10'
                    }`}>
                      {getStepStatus(selectedGroup.status, 3) === 'SUCCESS' ? (
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      ) : '4'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">Asset Tagging & Security Audit</h4>
                      <p className="text-[11px] text-white/40 mt-1">Company asset serials tagged in backend ITAM tracking ledger.</p>
                    </div>
                  </div>

                  {/* Step 5: Logistics */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-[25px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 ${
                      getStepStatus(selectedGroup.status, 4) === 'SUCCESS' ? 'bg-success shadow-[0_0_10px_rgba(7,202,107,0.5)]' : 
                      getStepStatus(selectedGroup.status, 4) === 'ACTIVE' ? 'bg-warning shadow-[0_0_10px_rgba(232,149,88,0.5)] animate-pulse' : 'bg-white/10'
                    }`}>
                      {getStepStatus(selectedGroup.status, 4) === 'SUCCESS' ? (
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      ) : '5'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">Dispatch & Logistics</h4>
                      <p className="text-[11px] text-white/40 mt-1">Package handover to courier for deployment transit.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-white mb-3">Tracked Equipment</h5>
                <div className="space-y-2 flex flex-col">
                  {selectedGroup.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/60">{getDeviceIcon(item.device_type)}</span>
                        <div>
                          <span className="text-xs font-semibold text-white capitalize">{item.device_type}</span>
                          <p className="text-[10px] text-white/40">{item.specs}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.status === 'delivered' ? 'bg-success/20 text-success' :
                        item.status === 'shipping' ? 'bg-primary/20 text-primary' :
                        item.status === 'approved' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/[0.05] flex flex-col gap-3">
              {selectedGroup.status === 'pending' && (
                <button 
                  onClick={() => updateGroupStatus(selectedGroup, 'approved')}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(24,86,255,0.3)] transition-colors">
                  Approve All Request Bundles
                </button>
              )}
              {selectedGroup.status === 'approved' && (
                <button 
                  onClick={() => updateGroupStatus(selectedGroup, 'shipping')}
                  className="w-full bg-warning hover:bg-warning/90 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(232,149,88,0.3)] transition-colors">
                  Ship Full Bundle
                </button>
              )}
              {selectedGroup.status === 'shipping' && (
                <button 
                  onClick={() => updateGroupStatus(selectedGroup, 'delivered')}
                  className="w-full bg-success hover:bg-success/90 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(7,202,107,0.3)] transition-colors">
                  Fulfill Complete Bundle
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvisioningQueue;
