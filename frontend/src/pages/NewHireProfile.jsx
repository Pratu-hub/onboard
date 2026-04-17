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
                // Formatting date to YYYY-MM-DD for input[type="date"]
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
        <div className="bg-[#F8F5F2] text-on-surface font-body min-h-screen flex items-center justify-center p-4">
            {/* Main Content Canvas */}
            <main className="w-full max-w-6xl">
                <div className="bg-white rounded-[2rem] shadow-[0_32px_96px_rgba(0,0,0,0.06)] overflow-hidden grid md:grid-cols-2 items-stretch min-h-[800px]">
                    {/* Left Side: Brand Panel */}
                    <div className="bg-[#004A83] bg-gradient-to-br from-[#0078D4] to-[#004A83] p-12 md:p-16 lg:p-20 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="font-headline text-3xl font-extrabold tracking-tighter mb-16">OnboardIQ</div>
                            <header className="mb-14">
                                <h1 className="font-headline text-5xl font-extrabold tracking-tight mb-8 leading-[1.1]">Complete your Profile.</h1>
                                <p className="text-blue-50 text-xl leading-relaxed font-medium opacity-90">Let's get your workspace ready for your first day.</p>
                            </header>
                            <div className="space-y-10">
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline font-bold text-xl">Account Created</h3>
                                        <p className="text-blue-50/70 text-base mt-1 leading-relaxed">Your professional identity has been successfully verified.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                                        <span className="material-symbols-outlined text-white text-2xl">person</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline font-bold text-xl">Personal Information</h3>
                                        <p className="text-blue-50/70 text-base mt-1 leading-relaxed">Current Step: Defining your role and organizational details.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Abstract decoration */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full -ml-40 -mb-40 blur-3xl"></div>
                        <div className="mt-auto pt-20 relative z-10">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-blue-200 mb-3">Step 2 of 2</p>
                                <p className="text-base italic text-blue-50/90 leading-relaxed">"Your profile data ensures you are assigned to the correct access groups and internal workflows."</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Personal Information Form */}
                    <div className="p-12 md:p-16 lg:p-20 flex flex-col justify-center items-center bg-white">
                        <div className="w-full max-w-md">
                            {/* Progress Indicator */}
                            <div className="mb-12 flex flex-col items-center">
                                <div className="flex gap-3 mb-5">
                                    <div className="h-2 w-20 rounded-full bg-[#0078D4]"></div>
                                    <div className="h-2 w-20 rounded-full bg-[#0078D4]"></div>
                                </div>
                                <span className="text-slate-400 font-headline text-[11px] uppercase tracking-[0.2em] font-bold">Step 2 of 2</span>
                            </div>

                            <div className="mb-12 text-center">
                                <h2 className="font-headline text-4xl font-extrabold tracking-tight text-[#1c1b1b] mb-4">Personal Information</h2>
                                <p className="text-slate-500 text-lg">Please finalize your professional details.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-headline text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Full Name</label>
                                        <input
                                            className="w-full px-5 py-4 rounded-xl bg-slate-50 focus:bg-white focus:outline focus:outline-2 focus:outline-[#0078D4] focus:-outline-offset-2 transition-all transition-colors duration-200 ease-in-out text-base placeholder:text-slate-400 border-none"
                                            placeholder="e.g. Jonathan Ive"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-headline text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Employee ID</label>
                                        <input
                                            className="w-full px-5 py-4 rounded-xl bg-slate-50 focus:bg-white focus:outline focus:outline-2 focus:outline-[#0078D4] focus:-outline-offset-2 transition-all transition-colors duration-200 ease-in-out text-base placeholder:text-slate-400 border-none"
                                            placeholder="IQ-2024-001"
                                            type="text"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-headline text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Department</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-5 py-4 rounded-xl bg-slate-50 focus:bg-white focus:outline focus:outline-2 focus:outline-[#0078D4] focus:-outline-offset-2 transition-all transition-colors duration-200 ease-in-out text-base appearance-none border-none"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                            >
                                                <option value="">Select</option>
                                                <option value="Engineering">Engineering</option>
                                                <option value="Design">Design</option>
                                                <option value="Operations">Operations</option>
                                                <option value="Human Resources">Human Resources</option>
                                                <option value="IT Operations">IT Operations</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-4 pointer-events-none text-slate-400">expand_more</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-headline text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Joining Date</label>
                                        <input
                                            className="w-full px-5 py-4 rounded-xl bg-slate-50 focus:bg-white focus:outline focus:outline-2 focus:outline-[#0078D4] focus:-outline-offset-2 transition-all transition-colors duration-200 ease-in-out text-base border-none text-slate-600"
                                            type="date"
                                            value={joiningDate}
                                            onChange={(e) => setJoiningDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-headline text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Reporting Manager</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400 text-xl">search</span>
                                        <input
                                            className="w-full pl-12 pr-5 py-4 rounded-xl bg-slate-50 focus:bg-white focus:outline focus:outline-2 focus:outline-[#0078D4] focus:-outline-offset-2 transition-all transition-colors duration-200 ease-in-out text-base placeholder:text-slate-400 border-none"
                                            placeholder="Search by name or email..."
                                            type="text"
                                            value={managerName}
                                            onChange={(e) => setManagerName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-8">
                                    <button
                                        type="submit"
                                        className="w-full py-5 rounded-xl bg-[#0078D4] text-white font-headline font-bold uppercase tracking-[0.15em] text-sm hover:bg-[#0060ab] transition-all active:scale-[0.98] shadow-lg shadow-[#0078D4]/20 border-none"
                                    >
                                        Save Progress &amp; Continue
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-[#0078D4] transition-colors border-none bg-transparent"
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
