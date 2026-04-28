import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';

const AICopilot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m your OnboardIQ HR Copilot 👋 Ask me anything about company policies, benefits, leave, IT support, or your onboarding journey.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const quickActions = [
        { label: '📅 Leave Policy', message: 'What is the leave policy?' },
        { label: '🏠 WFH Policy', message: 'What is the remote work policy?' },
        { label: '💊 Health Benefits', message: 'What health insurance benefits do I get?' },
        { label: '🖥️ IT Support', message: 'How do I contact IT support?' },
    ];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const sendMessage = async (text) => {
        const userMessage = text || input.trim();
        if (!userMessage) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        try {
            const data = await api('/chat', {
                method: 'POST',
                body: JSON.stringify({ message: userMessage }),
            });
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I\'m having trouble connecting right now. Please try again in a moment, or reach out to HR at hr@onboardiq.com.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* ── Floating Action Button ── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 z-[70] w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(24,86,255,0.5)] hover:shadow-[0_0_40px_rgba(24,86,255,0.7)] hover:scale-110 active:scale-95 transition-all group"
                >
                    <span className="material-symbols-outlined text-white text-2xl group-hover:rotate-12 transition-transform" style={{fontVariationSettings: "'FILL' 1"}}>
                        auto_awesome
                    </span>
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-2xl border-2 border-primary/50 animate-ping pointer-events-none"></span>
                </button>
            )}

            {/* ── Chat Window ── */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 z-[70] w-[380px] h-[520px] glass-elevated rounded-2xl overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 glass-animate-in">
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-lg" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white font-headline">HR Copilot</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                                        <span className="material-symbols-outlined text-primary text-xs" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-primary text-white rounded-br-md'
                                        : 'glass-surface text-white/80 rounded-bl-md border border-white/5'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                                    <span className="material-symbols-outlined text-primary text-xs animate-spin">progress_activity</span>
                                </div>
                                <div className="glass-surface px-4 py-3 rounded-2xl rounded-bl-md border border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0ms'}}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '150ms'}}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '300ms'}}></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Actions (shown only when few messages) */}
                    {messages.length <= 2 && !isTyping && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(action.message)}
                                    className="glass-surface px-3 py-1.5 rounded-full text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/15"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="px-4 py-3 border-t border-white/[0.08] flex-shrink-0">
                        <div className="flex items-center gap-2 glass-surface rounded-xl px-3 py-1 border border-white/5 focus-within:border-primary/40 transition-colors">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about policies, benefits, IT..."
                                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none py-2"
                                disabled={isTyping}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isTyping}
                                className="w-8 h-8 rounded-lg bg-primary/80 hover:bg-primary flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                            >
                                <span className="material-symbols-outlined text-white text-sm">send</span>
                            </button>
                        </div>
                        <p className="text-[9px] text-white/20 text-center mt-2">Powered by Azure OpenAI · Answers based on company handbook</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default AICopilot;
