import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { leadsDB } from '../../services/db';
import QualificationForm from './QualificationForm';
import { CheckCircle2, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PublicQualification() {
  const { id } = useParams(); // May be undefined for standalone
  const { toast } = useApp();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [submitted, setSubmitted] = useState(false);
  
  // Standalone Lead Data
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interestedDistrict: ''
  });
  const [step, setStep] = useState(id ? 'form' : 'profile');

  useEffect(() => {
    if (id) {
      const fetchLead = async () => {
        try {
          const data = await leadsDB.getPublic(id);
          if (data) setLead(data);
        } catch (err) {
          console.error("Failed to fetch lead info:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchLead();
    }
  }, [id]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!profile.firstName || !profile.email || !profile.phone) {
      toast("Please fill in name, email and phone", "warning");
      return;
    }
    setStep('form');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (id && !lead) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 400, padding: 40, textAlign: 'center' }}>
          <Building2 size={48} color="var(--brand-primary)" style={{ marginBottom: 20, opacity: 0.5 }} />
          <h2 style={{ margin: '0 0 12px' }}>Link Expired or Invalid</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>The qualification link you are using appears to be incorrect. Please contact your EarlyJobs representative.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: 60, textAlign: 'center', background: 'white' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' 
          }}>
            <CheckCircle2 size={40} color="#10b981" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Assessment Complete</h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 40px' }}>
            Thank you, <strong>{lead?.firstName || profile.firstName}</strong>! Your commitment details have been received. 
            Our selection committee will review your responses and contact you within 24–48 hours.
          </p>
          <div style={{ padding: 24, background: 'var(--bg-page)', borderRadius: 16, textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Next Steps</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              1. Profile Verification<br />
              2. Technical Review Call<br />
              3. Final Deployment Planning
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <Building2 size={32} color="var(--brand-primary)" />
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>EARLY<span style={{ color: 'var(--brand-primary)' }}>JOBS</span></span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Partner Qualification Form</h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
            {lead ? `Welcome back, ${lead.firstName}.` : "Evaluate the right franchise model for your entrepreneurial journey."}
          </p>
        </div>

        {step === 'profile' ? (
          <div className="glass-card animate-in" style={{ maxWidth: 600, margin: '0 auto', padding: 48, background: 'white', borderRadius: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Setup Your Profile</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Tell us a bit about yourself to get started.</p>
            
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    <input className="form-input" style={{ paddingLeft: 44 }} required value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input type="email" className="form-input" style={{ paddingLeft: 44 }} required value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input className="form-input" style={{ paddingLeft: 44 }} required value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Interested District</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input className="form-input" style={{ paddingLeft: 44 }} placeholder="E.g. Surat, Gujarat" value={profile.interestedDistrict} onChange={e => setProfile({...profile, interestedDistrict: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: 56, fontSize: 16, fontWeight: 800, marginTop: 12 }}>
                Start Assessment
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 40, background: 'white', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <QualificationForm 
              leadId={id} 
              isPublic={true}
              leadData={id ? null : profile}
              toast={(msg, type) => {
                toast(msg, type);
                if (type === 'success' && msg.includes('saved')) {
                  setSubmitted(true);
                }
              }} 
            />
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 13 }}>
          © 2026 EarlyJobs Marketplace Private Limited. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
