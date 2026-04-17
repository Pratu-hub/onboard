import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const ItAdminDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const updateStatus = async (id, status) => {
    try {
      await api(`/hardware/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchRequests();
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

  if (loading) return <div className="p-8 text-on-surface-variant">Loading IT tasks...</div>;
  if (error) return <div className="p-8 text-on-surface-variant text-red-500">Error: {error}</div>;

  return (
    <div className="pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-light text-on-surface mb-2">Hardware Provisioning</h1>
        <p className="text-on-surface-variant">
          Manage and track hardware requests for incoming hires.
        </p>
      </div>

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
                          <button onClick={() => updateStatus(req.id, 'approved')} className="text-xs px-3 py-1.5 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 transition-colors">Approve</button>
                        )}
                        {req.status === 'approved' && (
                          <button onClick={() => updateStatus(req.id, 'shipping')} className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">Ship Item</button>
                        )}
                        {req.status === 'shipping' && (
                          <button onClick={() => updateStatus(req.id, 'delivered')} className="text-xs px-3 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">Mark Delivered</button>
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
    </div>
  );
};

export default ItAdminDashboard;
