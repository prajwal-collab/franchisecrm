import React, { useState, useEffect } from 'react';
import { Save, Sparkles, HelpCircle, History, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function AISettings() {
  const { toast } = useApp();
  const { currentUser } = useAuth();

  const [context, setContext] = useState('');
  const [lastUpdated, setLastUpdated] = useState('Never');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/ai-context')
      .then(res => res.json())
      .then(data => {
        setContext(data.value || '');
        setLastUpdated(localStorage.getItem('ej_ai_context_updated') || 'Synced from Server');
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    try {
      await fetch('/api/settings/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: context })
      });
      const now = new Date().toLocaleString();
      localStorage.setItem('ej_ai_context_updated', now);
      setLastUpdated(now);
      toast('AI Sales Context synced to cloud', 'success');
    } catch (err) {
      toast('Failed to sync context', 'danger');
    }
  };

  if (currentUser.role !== 'Admin') {
    return <div className="page-body">Access Denied. Admins only.</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#33475b', margin: 0 }}>AI Sales Assistant Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Fine-tune how the AI generates scripts and strategies for your leads</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div className="flex-col gap-4">
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="var(--brand-primary)" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#33475b' }}>Core Sales Context (The "Handbook")</h4>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                <Save size={14} /> Save Changes
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                Paste your business context here. This includes your USP, pricing, common 
                objections, and the "voice" you want the AI to use. This information will 
                be provided to the AI for every lead strategy it generates.
              </p>
              <textarea 
                className="form-textarea" 
                style={{ minHeight: 400, fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Example: EarlyJobs is a franchise-first platform... Our USP is 100% placement support..."
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#33475b', marginBottom: 16 }}>Configuration Status</h4>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Last Updated</div>
                <div style={{ fontSize: 14, color: '#33475b', fontWeight: 600 }}>{lastUpdated}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>AI Model</div>
                <div style={{ fontSize: 14, color: '#33475b', fontWeight: 600 }}>DeepSeek-V3 (High Intelligence)</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>System Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#22c55e', fontWeight: 700 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  Active & Ready
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', background: '#f1f7ff', border: '1px solid #cce3ff', borderRadius: 8, display: 'flex', gap: 12 }}>
            <Info size={18} color="#007bff" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#2c5282', lineHeight: 1.5, margin: 0 }}>
              <strong>Optimization Tip:</strong> Be specific about your target audience. Instead of "Educated people", say "Retired teachers or Small business owners looking to diversify".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
