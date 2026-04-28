import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const ItAdminDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hardware'); // 'hardware' or 'accounts'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hardwareData, onboardingData] = await Promise.all([
        api('/hardware'),
        api('/onboarding/all-cases')
      ]);
      setRequests(hardwareData.requests || []);
      setCases(onboardingData.cases || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateHardwareStatus = async (id, status) => {
    try {
      await api(`/hardware/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getDeviceIcon = (type) => {
    switch(type) {
      case 'laptop': return 'laptop_mac';
      case 'monitor': return 'desktop_windows';
      case 'keyboard': return 'keyboard';
      case 'mouse': return 'mouse';
      case 'phone': return 'smartphone';
      default: return 'devices';
    }
  };

  if (loading) return <div className="p-8 text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Loading IT Admin Workspace...</div>;
  if (error) return <div className="p-8 text-on-surface-variant text-red-500">Error: {error}</div>;

  return (
    <div className="pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-light text-on-surface mb-2">IT Admin Command Center</h1>
        <p className="text-on-surface-variant">
          Orchestrate hardware distribution and automated user provisioning.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-outline-variant/15">
        <button 
          onClick={() => setActiveTab('hardware')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'hardware' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}
        >
          Hardware Queue ({requests.length})
        </button>
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'accounts' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}
        >
          User Accounts ({cases.length})
        </button>
      </div>

      {activeTab === 'hardware' ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container-low/30">
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Candidate & Dept</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Device</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Requested Specs</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-sm">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 px-6 text-center text-on-surface-variant">
                      No hardware requests pending.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-on-surface">{req.user_name}</div>
                        <div className="text-xs text-on-surface-variant">{req.department || req.user_email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">
                            {getDeviceIcon(req.device_type)}
                          </span>
                          <span className="capitalize font-medium text-on-surface">{req.device_type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-on-surface-variant max-w-[250px]">
                        {req.specs}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {req.status === 'delivered' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                          {req.status === 'shipping' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                          {req.status === 'approved' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                          {req.status === 'pending' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                          <span className="capitalize">{req.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-wrap justify-end gap-2 max-w-[200px] ml-auto">
                          {req.status === 'pending' && (
                            <button onClick={() => updateHardwareStatus(req.id, 'approved')} className="text-xs px-3 py-1.5 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 transition-colors">Approve</button>
                          )}
                          {req.status === 'approved' && (
                            <button onClick={() => updateHardwareStatus(req.id, 'shipping')} className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">Ship Item</button>
                          )}
                          {req.status === 'shipping' && (
                            <button onClick={() => updateHardwareStatus(req.id, 'delivered')} className="text-xs px-3 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">Mark Delivered</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* User Accounts / Provisioning Tab */
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container-low/30">
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Candidate</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Entra ID Status</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Onboarding Phase</th>
                  <th className="py-4 px-6 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Completion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-sm">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 px-6 text-center text-on-surface-variant">
                      No onboarding cases found.
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-on-surface">{c.name}</div>
                        <div className="text-xs text-on-surface-variant">{c.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {c.onboarding_status === 'completed' ? (
                            <>
                              <span className="material-symbols-outlined text-green-500 text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                              <span className="text-green-700 font-bold text-xs uppercase tracking-tight">Provisioned</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-on-surface-variant text-lg">hourglass_top</span>
                              <span className="text-on-surface-variant font-medium text-xs uppercase tracking-tight">Awaiting HR Approval</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[100px] bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${c.onboarding_status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${(c.current_step / c.total_steps) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-on-surface-variant">Step {c.current_step}/{c.total_steps}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-on-surface-variant">
                        {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItAdminDashboard;

