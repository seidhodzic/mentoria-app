'use client';
import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  "Explain the FIFA Clearing House regulations",
  "What is the protected period in a player contract?",
  "Write a sponsorship outreach email for a football club",
  "Help me plan my career as a FIFA licensed agent",
  "What are training compensation rules?",
  "Generate a professional bio for a sports executive",
  "What due diligence is needed for buying a football club?",
  "Explain just cause for contract termination",
];

export default function AIAssistant({
  userName, userRole,
}: {
  userName?: string; userRole?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello${userName ? `, ${userName.split(' ')[0]}` : ''}! I'm the Mentoria AI Assistant. I can help you with:\n\n• **FIFA regulations** and agent exam preparation\n• **Career planning** and professional development\n• **CV and bio** generation\n• **Sponsorship emails** and commercial outreach\n• **Football investment** advice\n• **Course content** questions\n\nWhat would you like help with today?`,
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);
    setStreamedText('');

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userRole,
          userName,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setStreamedText(full);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: full }]);
      setStreamedText('');
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatMessage(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^• /gm, '&bull; ')
      .replace(/\n/g, '<br/>');
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? 'var(--teal)' : 'var(--gold)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          color: open ? '#fff' : 'var(--teal)',
        }}
        title="Mentoria AI Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 1000,
          width: 'min(420px, calc(100vw - 40px))',
          height: 'min(580px, calc(100vh - 120px))',
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatIn 0.2s cubic-bezier(0.4,0,0.2,1) both',
        }}>
          <style>{`
            @keyframes chatIn {
              from { opacity: 0; transform: translateY(12px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            background: 'var(--teal)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            borderBottom: '1px solid rgba(247,188,21,0.2)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
                Mentoria AI
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                Sports · Investment · Education
              </div>
            </div>
            <button
              onClick={() => { setMessages([]); setStreamedText(''); setOpen(false); setTimeout(() => setOpen(true), 10); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Saira,sans-serif', padding: '4px 8px', borderRadius: 3, transition: 'color 0.15s' }}
              title="New conversation"
            >
              New
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: msg.role === 'user' ? 'var(--teal)' : 'rgba(25,53,62,0.05)',
                  color: msg.role === 'user' ? '#fff' : 'var(--teal)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamedText && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px',
                  borderRadius: '12px 12px 12px 3px',
                  background: 'rgba(25,53,62,0.05)',
                  color: 'var(--teal)', fontSize: '0.85rem', lineHeight: 1.6,
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(streamedText) }} />
                  <span style={{ display: 'inline-block', width: 6, height: 14, background: 'var(--gold)', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom', borderRadius: 1 }} />
                  <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
                </div>
              </div>
            )}

            {/* Loading dots */}
            {loading && !streamedText && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(25,53,62,0.05)', borderRadius: '12px 12px 12px 3px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                  <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }`}</style>
                </div>
              </div>
            )}

            {/* Suggestions (only when just greeting shown) */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(25,53,62,0.35)', marginBottom: 2 }}>
                  Try asking...
                </div>
                {SUGGESTIONS.slice(0, 4).map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ background: 'none', border: '1px solid rgba(25,53,62,0.1)', borderRadius: 6, padding: '7px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '0.78rem', color: 'rgba(25,53,62,0.65)', fontFamily: 'Saira,sans-serif', transition: 'all 0.15s', lineHeight: 1.4 }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--gold)'; (e.target as HTMLElement).style.color = 'var(--teal)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(25,53,62,0.1)'; (e.target as HTMLElement).style.color = 'rgba(25,53,62,0.65)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(25,53,62,0.08)', flexShrink: 0, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about FIFA, careers, investment..."
                disabled={loading}
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1.5px solid rgba(25,53,62,0.12)',
                  borderRadius: 6, padding: '9px 12px',
                  fontFamily: 'Saira,sans-serif', fontSize: '0.85rem',
                  color: 'var(--teal)', background: 'rgba(25,53,62,0.03)',
                  outline: 'none', lineHeight: 1.5, maxHeight: 120, overflow: 'auto',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'rgba(25,53,62,0.12)'}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 6, border: 'none',
                  background: loading || !input.trim() ? 'rgba(25,53,62,0.1)' : 'var(--gold)',
                  color: loading || !input.trim() ? 'rgba(25,53,62,0.3)' : 'var(--teal)',
                  cursor: loading || !input.trim() ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(25,53,62,0.25)', marginTop: 6, textAlign: 'center', letterSpacing: '0.06em' }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      )}
    </>
  );
}
