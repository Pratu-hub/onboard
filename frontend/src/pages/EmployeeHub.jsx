import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import AICopilot from '../components/AICopilot';

const EmployeeHub = () => {
    const { user } = useAuth();
    const [provisioning, setProvisioning] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await api('/onboarding/my-status');
            setProvisioning(data.provisioning);
        } catch (err) {
            console.error('Failed to fetch onboarding status:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'done': return { icon: 'check_circle', color: 'text-success', bg: 'bg-success/20', glow: 'shadow-[0_0_8px_rgba(7,202,107,0.4)]' };
            case 'in_progress': return { icon: 'pending', color: 'text-info', bg: 'bg-info/20', glow: 'shadow-[0_0_8px_rgba(56,189,248,0.4)]' };
            case 'pending': return { icon: 'schedule', color: 'text-white/40', bg: 'bg-white/10', glow: '' };
            default: return { icon: 'help', color: 'text-white/30', bg: 'bg-white/5', glow: '' };
        }
    };

    const roadmap = [
        {
            week: 'Week 1',
            title: 'Welcome & Orientation',
            tasks: [
                { label: 'Complete compliance training modules', done: true },
                { label: 'Meet your team and reporting manager', done: true },
                { label: 'Set up development environment', done: false },
                { label: 'Review team wiki & project docs', done: false },
            ]
        },
        {
            week: 'Week 2',
            title: 'Deep Dive & Integration',
            tasks: [
                { label: 'Shadow a senior team member', done: false },
                { label: 'Complete system access orientation', done: false },
                { label: 'Attend your first sprint planning', done: false },
                { label: 'Join relevant Slack channels', done: false },
            ]
        },
        {
            week: 'Week 3–4',
            title: 'First Contributions',
            tasks: [
                { label: 'Pick up your first task/ticket', done: false },
                { label: 'Submit your first pull request', done: false },
                { label: '1:1 with your manager (feedback session)', done: false },
                { label: '30-day self-assessment reflection', done: false },
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                    <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Loading your hub...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Welcome Hero Banner ── */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-success/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-success text-xl" style={{fontVariationSettings: "'FILL' 1"}}>celebration</span>
                        <span className="text-[10px] font-bold text-success uppercase tracking-[0.25em]">Onboarding Complete</span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight text-white mb-2">
                        Welcome aboard, {user?.name?.split(' ')[0] || 'Team Member'}! 🎉
                    </h1>
                    <p className="text-base text-white/60 leading-relaxed max-w-2xl">
                        Your documents have been verified and your accounts are being provisioned. 
                        This is your personal hub — check your setup status, follow your onboarding roadmap, 
                        and ask our AI assistant any questions about company policies.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-5">
                        <div className="glass-surface px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-white/70">
                            <span className="material-symbols-outlined text-sm text-primary">badge</span>
                            {user?.role?.replace('_', ' ') || 'Employee'}
                        </div>
                        <div className="glass-surface px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-white/70">
                            <span className="material-symbols-outlined text-sm text-primary">corporate_fare</span>
                            {user?.department || 'Engineering'}
                        </div>
                        <div className="glass-surface px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-white/70">
                            <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                            Joined {new Date(user?.joining_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Two-Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── IT Provisioning Tracker ── */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-info">settings_suggest</span>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white font-headline">IT Provisioning Status</h2>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Account & Access Setup</p>
                            </div>
                        </div>
                        {provisioning && (
                            <span className="text-[10px] font-bold text-success uppercase tracking-widest">
                                {provisioning.items.filter(i => i.status === 'done').length}/{provisioning.items.length} Complete
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {provisioning?.items?.map((item) => {
                            const st = getStatusIcon(item.status);
                            return (
                                <div key={item.id} className={`glass-surface rounded-xl px-4 py-3.5 flex items-center gap-4 transition-all ${item.status === 'done' ? 'opacity-80' : ''}`}>
                                    <div className={`w-8 h-8 rounded-lg ${st.bg} ${st.glow} flex items-center justify-center flex-shrink-0`}>
                                        <span className={`material-symbols-outlined text-sm ${st.color}`} style={{fontVariationSettings: "'FILL' 1"}}>{st.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold ${item.status === 'done' ? 'text-white/60 line-through' : 'text-white'}`}>{item.label}</p>
                                        <p className="text-[10px] text-white/40 mt-0.5 truncate">{item.detail}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                        item.status === 'done' ? 'text-success' :
                                        item.status === 'in_progress' ? 'text-info' : 'text-white/30'
                                    }`}>
                                        {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                    </span>
                                </div>
                            );
                        })}

                        {!provisioning && (
                            <div className="glass-surface rounded-xl p-8 text-center">
                                <span className="material-symbols-outlined text-3xl text-white/20 mb-2">hourglass_empty</span>
                                <p className="text-xs text-white/40">Provisioning details will appear here once HR completes your approval.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── First 30 Days Roadmap ── */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">route</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white font-headline">Your First 30 Days</h2>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Onboarding Roadmap</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {roadmap.map((phase, idx) => (
                            <div key={idx}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest ${
                                        idx === 0 ? 'bg-success/20 text-success' :
                                        idx === 1 ? 'bg-info/20 text-info' : 'bg-primary/20 text-primary'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{phase.title}</p>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{phase.week}</p>
                                    </div>
                                </div>

                                <div className="ml-4 border-l-2 border-white/[0.06] pl-6 space-y-2">
                                    {phase.tasks.map((task, tIdx) => (
                                        <div key={tIdx} className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined text-sm ${task.done ? 'text-success' : 'text-white/20'}`}
                                                  style={{fontVariationSettings: "'FILL' 1"}}>
                                                {task.done ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <span className={`text-xs ${task.done ? 'text-white/50 line-through' : 'text-white/80'}`}>
                                                {task.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── AI Copilot Widget ── */}
            <AICopilot />
        </div>
    );
};

export default EmployeeHub;
