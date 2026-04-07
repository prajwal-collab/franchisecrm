import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your CRM Insight AI. Ask me anything about your current leads, districts, and franchise performance." }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputVal.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.role !== 'system'), userMessage]
        })
      });

      if (!response.ok) {
        let errorMsg = 'API Request failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (pErr) {
          errorMsg = `Server Error (${response.status}): The assistant is temporarily unavailable.`;
        }
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (pErr) {
        throw new Error('Invalid response from server');
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ **AI Error:** ${err.message || 'Connection failed'}. Please check your configuration.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="animate-in fade-in"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--brand-primary)',
          color: 'white',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px -5px rgba(255, 107, 0, 0.4)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Sparkles size={24} />
      </button>

      {isOpen && (
        <div 
          className="animate-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '16px 20px', 
            background: '#111827', 
            color: 'white',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="var(--brand-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>AI Assistant</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Gemini Data
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f9fafb' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: 12,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  width: 28, height: 28, flexShrink: 0, borderRadius: '50%', 
                  background: msg.role === 'user' ? 'var(--brand-primary)' : '#e5e7eb',
                  color: msg.role === 'user' ? 'white' : '#4b5563',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{
                  background: msg.role === 'user' ? '#111827' : 'white',
                  color: msg.role === 'user' ? 'white' : '#33475b',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  borderTopRightRadius: msg.role === 'user' ? 2 : 12,
                  borderTopLeftRadius: msg.role === 'user' ? 12 : 2,
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  maxWidth: '85%',
                  border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                }} className="ai-chat-markdown">
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p style={{margin: '0 0 8px 0', minWidth: 200}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{margin: '0 0 8px 0', paddingLeft: 20}} {...props} />,
                        li: ({node, ...props}) => <li style={{marginBottom: 4}} {...props} />,
                        table: ({node, ...props}) => <div style={{overflowX: 'auto'}}><table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8}} {...props} /></div>,
                        th: ({node, ...props}) => <th style={{borderBottom: '1px solid #e5e7eb', padding: '6px', textAlign: 'left', background: '#f3f4f6'}} {...props} />,
                        td: ({node, ...props}) => <td style={{borderBottom: '1px solid #e5e7eb', padding: '6px'}} {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                 <div style={{ 
                  width: 28, height: 28, flexShrink: 0, borderRadius: '50%', 
                  background: '#e5e7eb', color: '#4b5563',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={14} />
                </div>
                <div style={{ padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <Loader2 size={16} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Ask about leads, conversions..."
                style={{
                  flex: 1,
                  padding: '12px 48px 12px 16px',
                  borderRadius: '24px',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  fontSize: '14px',
                  background: '#f9fafb'
                }}
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '6px',
                  bottom: '6px',
                  width: '32px',
                  borderRadius: '50%',
                  background: inputVal.trim() && !isLoading ? 'var(--brand-primary)' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputVal.trim() && !isLoading ? 'pointer' : 'default',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={14} style={{ marginLeft: 2 }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
