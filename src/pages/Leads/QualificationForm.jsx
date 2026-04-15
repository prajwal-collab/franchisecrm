import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Save, FileText, UserCheck, ShieldCheck, PenTool } from 'lucide-react';
import { qualificationsDB } from '../../services/db';

const FOFO_QUESTIONS = [
  "I am ready to treat this as a full-time business and be actively involved every single day.",
  "I am willing to hire, manage, and motivate a team (BDE + Recruiter) to hit daily targets.",
  "I am comfortable updating the CRM every day and attending weekly review calls.",
  "I understand there will be no quick or passive income — I am ready for hard work in the first 6 months.",
  "I am ready to follow all playbooks, 90-day checklists, and HQ processes without shortcuts.",
  "I accept that my revenue share comes only after 60-day candidate tenure and I must track it."
];

const FOCO_QUESTIONS = [
  "I am comfortable being a pure investor and letting HQ handle 100% of daily operations.",
  "I understand I will have no control over daily decisions and I am okay with that.",
  "I am ready to wait 3–6 months for the unit to stabilise and accept slower initial returns.",
  "I fully trust HQ to run the business and deliver the 45% profit share after 60-day tenure.",
  "I am investing for the long term (at least 2 years) and understand the risk-free buy-back option.",
  "I will not interfere in daily operations or demand daily updates from the team."
];

const FOFO_OPEN_QUESTIONS = [
  "Why do you want to become a FOFO franchise owner? What is your main goal?",
  "How many hours per day/week are you personally willing to dedicate to this business in the first 6 months?",
  "What will you do differently from a normal 9-to-5 job to make this franchise successful?",
  "If you miss your daily targets for two weeks in a row, what will you do?"
];

const FOCO_OPEN_QUESTIONS = [
  "Why do you want to become a FOCO partner? Are you looking for passive income, long-term wealth, or something else?",
  "How do you feel about having zero control over daily operations while HQ runs everything?",
  "What are your expectations about returns in the first 6 months and after 2 years?",
  "If the unit takes longer than expected to become profitable, how will you react?"
];

export default function QualificationForm({ leadId, leadData, toast }) {
  const [loading, setLoading] = useState(leadId ? true : false);
  const [saving, setSaving] = useState(false);
  const [formType, setFormType] = useState('FOFO'); // FOFO or FOCO
  const [scores, setScores] = useState(Array(6).fill(5));
  const [openAnswers, setOpenAnswers] = useState(Array(4).fill(''));
  const [signature, setSignature] = useState('');
  const [declaration, setDeclaration] = useState(false);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  
  const getStatus = (score) => {
    if (score >= 45) return { text: 'Strong Fit', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    if (score >= 35) return { text: 'Borderline', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    return { text: 'Not Recommended', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  const status = getStatus(totalScore);

  useEffect(() => {
    if (leadId) {
      const loadData = async () => {
        try {
          const data = await qualificationsDB.getByLeadId(leadId);
          if (data) {
            setFormType(data.type);
            setScores(data.scores);
            setOpenAnswers(data.openAnswers);
            setSignature(data.signature);
            setDeclaration(true);
          }
        } catch (err) {
          console.error("Failed to load qualification data:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [leadId]);

  const handleScoreChange = (idx, val) => {
    const newScores = [...scores];
    newScores[idx] = val;
    setScores(newScores);
  };

  const handleOpenAnswerChange = (idx, val) => {
    const newAnswers = [...openAnswers];
    newAnswers[idx] = val;
    setOpenAnswers(newAnswers);
  };

  const handleSave = async () => {
    if (!declaration) {
      toast("Please accept the self-declaration first", "warning");
      return;
    }
    if (!signature.trim()) {
      toast("Signature is required", "warning");
      return;
    }

    setSaving(true);
    try {
      await qualificationsDB.save({
        leadId,
        leadData, // Pass standalone lead data
        type: formType,
        scores,
        openAnswers,
        totalScore,
        qualificationStatus: status.text,
        signature,
        date: new Date().toISOString()
      });
      toast("Qualification form saved successfully", "success");
    } catch (err) {
      toast("Failed to save qualification form", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-muted" style={{ textAlign: 'center', padding: 40 }}>Loading qualification form...</div>;

  const currentQuestions = formType === 'FOFO' ? FOFO_QUESTIONS : FOCO_QUESTIONS;
  const currentOpenQuestions = formType === 'FOFO' ? FOFO_OPEN_QUESTIONS : FOCO_OPEN_QUESTIONS;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Qualification Assessment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Evaluate lead mindset and investment readiness</p>
        </div>
        <div className="glass-card" style={{ padding: '6px', display: 'flex', gap: 4, borderRadius: 12 }}>
          <button 
            onClick={() => setFormType('FOFO')}
            className={`btn ${formType === 'FOFO' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 8, padding: '8px 20px', fontSize: 13 }}
          >
            Active (FOFO)
          </button>
          <button 
            onClick={() => setFormType('FOCO')}
            className={`btn ${formType === 'FOCO' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 8, padding: '8px 20px', fontSize: 13 }}
          >
            Passive (FOCO)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Scored Questions */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <ShieldCheck size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Core Capability Score (60 Points)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentQuestions.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: 24, background: 'var(--bg-white)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-page)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 14, fontWeight: 800, color: 'var(--brand-primary)', flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>{q}</p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[...Array(10)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handleScoreChange(idx, i + 1)}
                            style={{
                              flex: 1, height: 40, border: '1px solid var(--border-color)', borderRadius: 6,
                              background: scores[idx] === i + 1 ? 'var(--brand-primary)' : 'white',
                              color: scores[idx] === i + 1 ? 'white' : 'var(--text-muted)',
                              fontSize: 12, fontWeight: 700, transition: 'all 0.2s', cursor: 'pointer'
                            }}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Open Questions */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <UserCheck size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Mindset Check (Open-Ended)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentOpenQuestions.map((q, idx) => (
                <div key={idx} className="glass-card" style={{ padding: 24 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question {idx + 1}</p>
                  <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>{q}</p>
                  <textarea 
                    className="glass-input" 
                    placeholder="Type your response here..."
                    value={openAnswers[idx]}
                    onChange={(e) => handleOpenAnswerChange(idx, e.target.value)}
                    style={{ minHeight: 100, width: '100%', fontSize: 14, lineHeight: 1.6 }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Declaration */}
          <section className="glass-card" style={{ padding: 32, border: '1px solid var(--brand-primary-light)', background: 'rgba(255, 107, 0, 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <FileText size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Self-Declaration</h3>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              I understand that the {formType} model requires {formType === 'FOFO' ? 'daily execution and active involvement' : 'a passive investment approach and zero interference in daily operations'}. I confirm that all information provided above is honest and reflects my real commitment level.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Digital Signature</label>
                <div style={{ position: 'relative' }}>
                   <PenTool style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} size={16} />
                   <input 
                    className="form-input" 
                    style={{ paddingLeft: 44, fontStyle: 'italic', fontSize: 18 }} 
                    placeholder="Type Full Name" 
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <input 
                  type="checkbox" 
                  id="declaration" 
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--brand-primary)' }} 
                />
                <label htmlFor="declaration" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>I accept and confirm the declaration</label>
              </div>
            </div>
          </section>

          <button 
            className="btn btn-primary" 
            style={{ height: 56, fontSize: 16, fontWeight: 800, width: '100%', justifyContent: 'center', gap: 12, borderRadius: 12 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : <><Save size={20} /> Complete Qualification</>}
          </button>
        </div>

        {/* Scoring Sidebar */}
        <div style={{ position: 'sticky', top: 32 }}>
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Qualification Status</div>
            
            <div style={{ 
              width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-page)', 
              margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', border: `8px solid ${status.color}`, boxShadow: `0 0 20px ${status.bg}`
            }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>{totalScore}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>/ 60</div>
              </div>
            </div>

            <div style={{ 
              padding: '12px 20px', borderRadius: 100, background: status.bg, color: status.color, 
              fontSize: 14, fontWeight: 800, marginBottom: 32, display: 'inline-block'
            }}>
              {status.text}
            </div>

            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.02)', padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertCircle size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>SCORING RULES</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Strong Fit</span>
                  <span style={{ fontWeight: 700 }}>45–60</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Borderline</span>
                  <span style={{ fontWeight: 700 }}>35–44</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Low Score</span>
                  <span style={{ fontWeight: 700 }}>Below 35</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, padding: 24, background: 'var(--brand-primary)', borderRadius: 16, color: 'white' }}>
               <CheckCircle size={32} style={{ marginBottom: 16, opacity: 0.8 }} />
               <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>Expert Analysis</h4>
               <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
                 The status is calculated based on commitment levels and investment trust.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
