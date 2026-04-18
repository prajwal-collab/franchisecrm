import React from 'react';
import { 
  Clipboard, ExternalLink, MessageSquare, 
  Settings, Image, CheckCircle, HelpCircle,
  Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FORMS = [
  {
    id: 'activation',
    title: 'Franchise Activation Form',
    desc: 'Required for STAGE 2 territory lock and document verification.',
    url: 'https://franchise.earlyjobs.in/franchise-activation-form',
    icon: Settings,
    color: '#FF6B00'
  },
  {
    id: 'branding',
    title: 'Branding Confirmation',
    desc: 'Submission of branding plans and office setup approval.',
    url: 'https://franchise.earlyjobs.in/branding-form',
    icon: Image,
    color: '#0066FF'
  },
  {
    id: 'photo',
    title: 'Photo/Video Submission',
    desc: 'Collection of launch event media and office branding photos.',
    url: 'https://franchise.earlyjobs.in/photo-submission',
    icon: Share2,
    color: '#10B981'
  },
  {
    id: 'feedback',
    title: 'Final Feedback Form',
    desc: 'Collected post-launch to evaluate the onboarding experience.',
    url: 'https://franchise.earlyjobs.in/feedback-form',
    icon: HelpCircle,
    color: '#8B5CF6'
  }
];

export default function OnboardingForms() {
  const { toast } = useApp();

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast(`${label} link copied to clipboard!`, 'success');
  };

  const shareToWhatsApp = (url, title) => {
    const text = encodeURIComponent(`Hi, please fill out the ${title} here: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Onboarding Forms Hub</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 16 }}>Manage and share key documentation links with your franchisees</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
        {FORMS.map(form => {
          const Icon = form.icon;
          const url = form.url;
          
          return (
            <div key={form.id} className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: 16, background: `${form.color}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.color 
                }}>
                  <Icon size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>{form.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>{form.desc}</p>
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg-page)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24
              }}>
                <code style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {url}
                </code>
                <button 
                  onClick={() => copyToClipboard(url, form.title)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand-primary)', display: 'flex' }}
                >
                  <Clipboard size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700 }}
                  onClick={() => window.open(form.url, '_blank')}
                >
                  <ExternalLink size={16} /> Preview
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ flex: 1, height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid var(--border-color)' }}
                  onClick={() => shareToWhatsApp(url, form.title)}
                >
                  <MessageSquare size={16} /> WhatsApp
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: 48, padding: 32, background: 'linear-gradient(135deg, rgba(255,107,0,0.05) 0%, rgba(255,107,0,0.02) 100%)', 
        borderRadius: 24, border: '1px dashed var(--brand-primary)' 
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' 
          }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Admin Best Practices</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, maxWidth: 800 }}>
              These forms are designed to be mobile-responsive. When a franchisee reaches a specific milestone in the <strong>Activations</strong> workflow, use this hub to send them the required link. 
              Submissions will automatically be tagged to the respective partner record for tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
