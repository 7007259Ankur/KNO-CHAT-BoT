import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
}

export function ChatInterface({ messages, onSendMessage, isTyping }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) { onSendMessage(input); setInput(''); }
  };

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>
        <div>
          <h2 className="text-xl font-light" style={{ color: '#ffffff' }}>
            Session: <span className="font-semibold">General Assistant</span>
          </h2>
          <p style={{ color: '#00f2ff', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
            Model: Groq / Llama3-8b
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '6px 14px', borderRadius: '999px', border: '1px solid rgba(34,197,94,0.3)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          System Online
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.length === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '420px', margin: '0 auto', gap: '16px' }}>
            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Bot style={{ width: '40px', height: '40px', color: '#60a5fa', margin: '0 auto 12px' }} />
              <h3 style={{ color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>Welcome to AI Knowledge Bot</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>Upload PDFs, DOCX, or TXT files and ask me anything about them.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
              {['Summarize document', 'Extract key metrics', 'Explain concepts', 'Analyze trends'].map(q => (
                <button key={q} onClick={() => onSendMessage(q)}
                  style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <div style={{ display: 'flex', gap: '12px', maxWidth: '78%', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'user' ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.3)', border: `1px solid ${m.role === 'user' ? 'rgba(139,92,246,0.5)' : 'rgba(59,130,246,0.5)'}`, color: m.role === 'user' ? '#c084fc' : '#60a5fa' }}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{
                  padding: '14px 18px', borderRadius: '16px', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  background: m.role === 'user' ? 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))' : 'rgba(255,255,255,0.1)',
                  border: m.role === 'user' ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.15)',
                  color: '#f1f5f9',
                  borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: m.role === 'user' ? '16px' : '4px',
                }}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#60a5fa' }}>
                <Bot size={16} />
              </div>
              <div ref={indicatorRef} style={{ background: 'rgba(255,255,255,0.08)', padding: '14px 18px', borderRadius: '16px', borderBottomLeftRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00f2ff' }} />
                <div className="dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00f2ff' }} />
                <div className="dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00f2ff' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '20px 40px 28px' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', padding: '8px 8px 8px 20px', backdropFilter: 'blur(20px)' }}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about your knowledge base..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 500 }}
            />
            <button type="submit" disabled={!input.trim() || isTyping}
              style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f2ff, #bc13fe)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: (!input.trim() || isTyping) ? 0.4 : 1, transition: 'opacity 0.2s' }}
            >
              {isTyping ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            </button>
          </div>
        </form>
        <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Powered by Groq & FAISS Vector Core
        </p>
      </div>
    </div>
  );
}
