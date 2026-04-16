import React from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, CheckCircle2, FileText, Send } from 'lucide-react';

const FORM_META = {
  '/franchise-activation-form': {
    title: 'Franchise Activation & KYC',
    desc: 'Verify your business details and territory authorization.',
    icon: Building2,
    color: '#FF6B00'
  },
  '/branding-form': {
    title: 'Branding & Office Setup',
    desc: 'Submit your office layout and branding installation plans.',
    icon: FileText,
    color: '#0066FF'
  },
  '/photo-submission': {
    title: 'Media Submission Portal',
    desc: 'Upload high-resolution launch photos and branding videos.',
    icon: Send,
    color: '#10B981'
  },
  '/feedback-form': {
    title: 'Post-Onboarding Feedback',
    desc: 'Help us improve our partner experience by sharing your thoughts.',
    icon: CheckCircle2,
    color: '#8B5CF6'
  }
};

export default function PublicOnboardingForm() {
  const location = useLocation();
  const meta = FORM_META[location.pathname] || {
    title: 'EarlyJobs Partner Portal',
    desc: 'Franchise Onboarding System',
    icon: Building2,
    color: '#FF6B00'
  };

  const Icon = meta.icon;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24,
            opacity: 0.8
          }}>
            <Building2 size={24} color="var(--brand-primary)" />
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>EARLY<span style={{ color: 'var(--brand-primary)' }}>JOBS</span></span>
          </div>
        </div>

        <div className="glass-card animate-in" style={{ padding: 60, background: 'white', borderRadius: 32, textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.05)' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 24, background: `${meta.color}10`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color,
            margin: '0 auto 32px'
          }}>
            <Icon size={40} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>{meta.title}</h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 40px' }}>{meta.desc}</p>

          <div style={{ 
            padding: 32, background: 'var(--bg-page)', borderRadius: 20, textAlign: 'left',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>System Notice</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This form is currently being optimized for your territory. Please contact your dedicated <strong>EarlyJobs Franchise Manager</strong> or reach out on <a href="https://wa.me/91XXXXXXXXXX" target="_blank" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a> to proceed with this step manually.
            </p>
          </div>

          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                © 2026 EarlyJobs Marketplace Private Limited.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
