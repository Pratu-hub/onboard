import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const data = await api('/users');
      // Filter out only HR and IT_ADMIN roles
      const filtered = data.users.filter(u => u.role === 'HR' || u.role === 'IT_ADMIN');
      setTeamMembers(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeReviewersCount = teamMembers.filter(m => m.role === 'HR').length;

  return (
    <div className="glass-animate-in text-white/90 font-body">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
            <span>Directory</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]">Internal Team</span>
          </nav>
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-white drop-shadow-sm">Team Management</h2>
          <p className="text-white/60 max-w-lg font-medium text-sm leading-relaxed mt-2">
            Orchestrate your HR review cycle and manage administrative access permissions across the enterprise suite.
          </p>
        </div>
        <button className="group flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-xl font-headline font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(24,86,255,0.3)] active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg" style={{fontVariationSettings: "'FILL' 1"}}>person_add</span>
          Add HR Reviewer
        </button>
      </div>

      {/* Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-8 glass-panel rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Total Active Reviewers</p>
            <h3 className="text-4xl font-headline font-extrabold text-white">{loading ? '-' : activeReviewersCount}</h3>
            <div className="mt-4 flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Optimal
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/[0.03] group-hover:scale-110 transition-transform">groups</span>
        </div>
        <div className="p-8 glass-panel rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Avg Cases / Reviewer</p>
            <h3 className="text-4xl font-headline font-extrabold text-white">18.2</h3>
            <div className="mt-4 flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">speed</span>
              Optimal Capacity
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/[0.03] group-hover:scale-110 transition-transform">monitoring</span>
        </div>
        <div className="p-8 bg-primary rounded-3xl text-white relative overflow-hidden group shadow-[0_10px_30px_rgba(24,86,255,0.2)]">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mb-2">Pending Invitations</p>
            <h3 className="text-4xl font-headline font-extrabold">0</h3>
            <div className="mt-4 flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">mail</span>
              All Caught Up
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 group-hover:scale-110 transition-transform">outgoing_mail</span>
        </div>
      </div>

      {/* High-Density Data Canvas */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl mb-12">
        <div className="p-8 border-b border-white/[0.05] flex justify-between items-center glass-surface">
          <h4 className="font-headline font-bold text-lg text-white">Member Directory</h4>
          <div className="flex gap-2">
            <button className="p-2 rounded-xl hover:bg-white/10 text-white/60 transition-colors border border-transparent hover:border-white/10">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 rounded-xl hover:bg-white/10 text-white/60 transition-colors border border-transparent hover:border-white/10">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-white/40 font-mono text-xs uppercase tracking-widest animate-pulse">Loading directory...</div>
        ) : error ? (
          <div className="p-12 text-center text-danger font-mono text-xs uppercase tracking-widest">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  <th className="px-8 py-6">Reviewer Profile</th>
                  <th className="px-8 py-6">Administrative Role</th>
                  <th className="px-8 py-6">Current Workload</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold font-headline text-lg text-white">
                            {member.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-[#0a0a12] rounded-full shadow-[0_0_10px_rgba(7,202,107,0.5)]"></div>
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{member.name}</p>
                          <p className="text-xs text-white/50">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] ${member.role === 'IT_ADMIN' ? 'badge-info' : 'badge-warning'}`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 glass-surface rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${member.role === 'IT_ADMIN' ? 'bg-primary shadow-[0_0_10px_rgba(24,86,255,0.5)] w-1/4' : 'bg-warning shadow-[0_0_10px_rgba(232,149,88,0.5)] w-3/4'}`}></div>
                        </div>
                        <span className="text-xs font-bold text-white/60">{member.role === 'IT_ADMIN' ? '25%' : '75%'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors">Edit</button>
                        <button className="text-[10px] font-bold text-danger uppercase tracking-widest hover:text-white transition-colors">Revoke</button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {teamMembers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-12 text-center text-white/40 text-xs font-mono uppercase tracking-widest">
                      No team members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && teamMembers.length > 0 && (
          <div className="px-8 py-6 border-t border-white/[0.05] glass-surface flex justify-between items-center text-xs font-bold text-white/40 uppercase tracking-widest">
            <p>Showing {teamMembers.length} of {teamMembers.length} Team Members</p>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="px-3 py-1 bg-primary text-white rounded-lg shadow-[0_0_10px_rgba(24,86,255,0.4)]">1</button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proactive Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <h5 className="font-headline font-bold text-2xl tracking-tight mb-6 text-white">Audit Transparency</h5>
          <div className="glass-panel p-8 rounded-3xl space-y-8">
            <div className="flex gap-4">
              <div className="w-1 h-12 bg-primary rounded-full shadow-[0_0_10px_rgba(24,86,255,0.5)]"></div>
              <div>
                <p className="text-[10px] font-bold uppercase text-primary tracking-widest drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]">Recent System Action</p>
                <p className="text-white text-sm font-semibold mt-1">David Wright updated security permissions for 12 new hires.</p>
                <p className="text-xs text-white/40 mt-1 font-mono">24 minutes ago • Security Audit Log #4421</p>
              </div>
            </div>
            <div className="flex gap-4 opacity-60">
              <div className="w-1 h-12 bg-white/30 rounded-full"></div>
              <div>
                <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest">Role Change</p>
                <p className="text-white/80 text-sm font-semibold mt-1">Maria Lopez was promoted to Senior HR Reviewer status.</p>
                <p className="text-xs text-white/40 mt-1 font-mono">Yesterday, 4:12 PM • Admin Panel</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-5 flex flex-col justify-end">
          <div className="relative p-8 glass-panel border border-primary/20 rounded-3xl bg-primary/5">
            <span className="material-symbols-outlined text-4xl text-primary mb-6 drop-shadow-[0_0_10px_rgba(24,86,255,0.5)]">verified_user</span>
            <h6 className="font-headline font-bold text-xl mb-3 text-white">Automated Policy Enforcement</h6>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Your team is currently operating under the <b className="text-white">Strict Access Protocol</b>. Temporary accounts are automatically purged after 14 days of inactivity.
            </p>
            <a href="#" className="text-primary font-bold text-[10px] uppercase tracking-widest hover:text-white flex items-center gap-2 transition-colors">
              Configure Policy <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
