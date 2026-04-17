import { Bot, FileText, History, Settings, PlusCircle } from 'lucide-react';

interface SidebarProps {
  onNewChat: () => void;
}

export function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <aside style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Logo */}
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00f2ff, #bc13fe)', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', boxShadow: '0 0 20px rgba(0,242,255,0.5)' }} />
          <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'linear-gradient(to right, #ffffff, #cccccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Knowledge Bot
          </h1>
        </div>

        <button onClick={onNewChat} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ffffff', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          <PlusCircle size={18} color="#60a5fa" />
          New Chat
        </button>
      </div>

      {/* History */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', padding: '0 8px' }}>
          Chat History
        </div>
        {['Project Specs Refined', 'Code Review - API', 'Design Feedback'].map((item, i) => (
          <button key={i} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px', transition: 'all 0.2s', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <History size={15} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Knowledge Base
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', marginBottom: '6px' }}>
            <FileText size={15} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Vector Store Active</span>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
            Upload documents to start chatting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4b5563, #374151)', border: '1px solid rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Ankur Kumar</span>
          </div>
          <Settings size={16} color="rgba(255,255,255,0.4)" style={{ cursor: 'pointer' }} />
        </div>
      </div>
    </aside>
  );
}
