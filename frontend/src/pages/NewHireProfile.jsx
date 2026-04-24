import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const NewHireProfile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [managerName, setManagerName] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmployeeId(user.employee_id || '');
            setDepartment(user.department || '');
            if (user.joining_date) {
                const dateObj = new Date(user.joining_date);
                setJoiningDate(dateObj.toISOString().split('T')[0]);
            }
            setManagerName(user.manager_name || '');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api(`/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name,
                    employee_id: employeeId,
                    department,
                    joining_date: joiningDate || null,
                    manager_name: managerName
                })
            });
            navigate('/dashboard/new-hire');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    };

    const handleSkip = () => {
        navigate('/dashboard/new-hire');
    };

    return (
        <div className="text-white font-body min-h-screen flex items-center justify-center p-4 glass-animate-in">
            {/* Main Content Canvas */}
            <main className="w-full max-w-6xl">
                <div className="glass-panel rounded-[2rem] overflow-hidden grid md:grid-cols-2 items-stretch min-h-[700px]">
                    
                    {/* Left Side: Brand Panel */}
                    <div className="p-12 md:p-16 lg:p-20 flex flex-col justify-between text-white relative overflow-hidden bg-primary/5">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -ml-40 -mb-40"></div>
                        
                        <div className="relative z-10">
                            <div className="font-headline text-3xl font-extrabold tracking-tighter mb-16 text-white drop-shadow-sm">OnboardIQ</div>
                            <header className="mb-14">
                                <h1 className="font-headline text-5xl font-extrabold tracking-tight mb-6 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">Complete your Profile.</h1>
                                <p className="text-white/60 text-lg leading-relaxed font-medium">Let's get your workspace ready for your first day.</p>
                            </header>
                            <div className="space-y-8">
                                <div className="flex items-start gap-5 glass-surface p-5 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center shrink-0 border border-success/30 shadow-[0_0_15px_rgba(7,202,107,0.2)]">
                                        <span className="material-symbols-outlined text-success text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline font-bold text-lg text-white">Account Created</h3>
                                        <p className="text-white/50 text-sm mt-1 leading-relaxed">Your professional identity has been successfully verified.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5 glass-surface p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/5"></div>
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 relative z-10 shadow-[0_0_15px_rgba(24,86,255,0.3)]">
                                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-headline font-bold text-lg text-white">Personal Information</h3>
                                        <p className="text-white/50 text-sm mt-1 leading-relaxed">Current Step: Defining your role and organizational details.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Personal Information Form */}
                    <div className="p-12 md:p-16 flex flex-col justify-center items-center relative">
                        <div className="w-full max-w-md relative z-10">
                            {/* Progress Indicator */}
                            <div className="mb-10 flex flex-col items-center">
                                <div className="flex gap-2 mb-4">
                                    <div className="h-1.5 w-16 rounded-full bg-primary/50"></div>
                                    <div className="h-1.5 w-16 rounded-full bg-primary shadow-[0_0_8px_rgba(24,86,255,0.6)]"></div>
                                </div>
                                <span className="text-white/40 font-headline text-[10px] uppercase tracking-[0.2em] font-bold">Step 2 of 2</span>
                            </div>

                            <div className="mb-10 text-center">
                                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-white mb-3">Professional Details</h2>
                                <p className="text-white/50 text-sm">Please finalize your internal directory information.</p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-headline text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                        <input
                                            className="w-full px-4 py-3 rounded-xl glass-surface focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm text-white placeholder:text-white/20 border border-white/10 outline-none"
                                            placeholder="e.g. Jordan Miller"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-headline text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Employee ID</label>
                                        <input
                                            className="w-full px-4 py-3 rounded-xl glass-surface focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm text-white placeholder:text-white/20 border border-white/10 outline-none"
                                            placeholder="IQ-2024-001"
                                            type="text"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-headline text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Department</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 rounded-xl glass-surface focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm text-white appearance-none border border-white/10 outline-none"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                            >
                                                <option value="" className="bg-slate-900 text-white">Select</option>
                                                <option value="Engineering" className="bg-slate-900 text-white">Engineering</option>
                                                <option value="Design" className="bg-slate-900 text-white">Design</option>
                                                <option value="Operations" className="bg-slate-900 text-white">Operations</option>
                                                <option value="Human Resources" className="bg-slate-900 text-white">Human Resources</option>
                                                <option value="IT Operations" className="bg-slate-900 text-white">IT Operations</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-white/30 text-lg">expand_more</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-headline text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Joining Date</label>
                                        <input
                                            className="w-full px-4 py-3 rounded-xl glass-surface focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm text-white border border-white/10 outline-none [color-scheme:dark]"
                                            type="date"
                                            value={joiningDate}
                                            onChange={(e) => setJoiningDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-headline text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Reporting Manager</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-3 text-white/30 text-lg">search</span>
                                        <input
                                            className="w-full pl-11 pr-4 py-3 rounded-xl glass-surface focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm text-white placeholder:text-white/20 border border-white/10 outline-none"
                                            placeholder="Search by name or email..."
                                            type="text"
                                            value={managerName}
                                            onChange={(e) => setManagerName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-6">
                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold uppercase tracking-[0.15em] text-[11px] hover:bg-primary/90 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(24,86,255,0.4)] border-none"
                                    >
                                        Save Progress &amp; Continue
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="w-full py-3 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors border-none bg-transparent"
                                    >
                                        Skip for now
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NewHireProfile;
