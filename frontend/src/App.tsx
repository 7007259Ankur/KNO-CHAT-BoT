import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { FileUpload } from './components/FileUpload';
import { Background3D } from './components/Background3D';
import { Message } from './types';
import { LayoutDashboard, Upload } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        id: '1',
        role: 'ai',
        content: "Hello! I'm your AI Knowledge Assistant powered by Groq. Upload some PDFs, DOCX, or TXT files and ask me anything about them.",
        timestamp: new Date(),
      }]);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: content }),
      });

      const data = await res.json();
      const answerText = data.answer || data.error || 'Something went wrong.';
      const sources: string[] = data.sources || [];

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: sources.length
          ? `${answerText}\n\n📄 Sources: ${sources.join(', ')}`
          : answerText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Failed to reach the backend. Make sure Django is running on port 8000.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) console.error('Upload error:', data.error);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen text-white overflow-hidden" style={{ background: '#0a0a12' }}>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[60%]" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(188,19,254,0.35), transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%]" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(0,242,255,0.35), transparent 60%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }} />
      </div>

      <Background3D />

      <div className="h-full hidden lg:block z-20">
        <div className="w-[280px] h-full">
          <Sidebar onNewChat={() => setMessages([])} />
        </div>
      </div>

      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        <div className="lg:hidden flex border-b border-white/5 bg-black/40 backdrop-blur-xl p-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all
              ${activeTab === 'chat' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-white/40'}`}
          >
            <LayoutDashboard size={18} />
            <span className="text-xs font-semibold">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all
              ${activeTab === 'knowledge' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-white/40'}`}
          >
            <Upload size={18} />
            <span className="text-xs font-semibold">Knowledge</span>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 h-full ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
            />
          </div>

          <div className={`w-[360px] h-full border-l overflow-y-auto space-y-8 scrollbar-hide
            ${activeTab === 'knowledge' ? 'fixed inset-0 lg:relative z-50' : 'hidden xl:block'}`}
            style={{ background: 'rgba(8,8,18,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.1)', padding: '32px' }}>
            <div className="flex items-center justify-between">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Knowledge Sync</h3>
              <button onClick={() => setActiveTab('chat')} className="lg:hidden p-2 hover:bg-white/10 rounded-full">
                <LayoutDashboard size={20} color="#ffffff" />
              </button>
            </div>

            <section className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 700 }}>
                <Upload size={12} />
                <span>Upload Documents</span>
              </div>
              <FileUpload onUpload={handleFileUpload} />
            </section>

            <section className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 700 }}>
                <LayoutDashboard size={12} />
                <span>System Capabilities</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
                {['PDF Parsing', 'Vector Indexing', 'RAG Retrieval', 'Contextual Chat'].map(cap => (
                  <li key={cap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{cap}</span>
                    <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
