import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Edit2, Trash2, Calendar, Phone, Mail, 
  MapPin, User, Briefcase, Wallet, History, MessageSquare,
  Plus, Video, CheckCircle, Clock, RefreshCw, Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import LeadForm from './LeadForm';
import QualificationForm from './QualificationForm';
import { STAGES } from '../../data/initialData';

const STAGE_BADGE = {
  'New Lead': 'badge-new-lead', 'Contacted': 'badge-contacted', 'Follow Up': 'badge-warning', 'Interested': 'badge-interested',
  'Webinar Registered': 'badge-webinar-reg', 'Webinar Attended': 'badge-webinar-att',
  '1:1 Scheduled': 'badge-1-1', 'Qualified': 'badge-qualified', 'Negotiation': 'badge-negotiation',
  'Closed Won': 'badge-closed-won', 'Closed Lost': 'badge-closed-lost',
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, districts, users, tasks, meetings, updateLead, deleteLead, createTask, toggleTask, updateTask, createMeeting, deleteMeeting, toast } = useApp();
  const { currentUser, can } = useAuth();

  const [activeTab, setActiveTab] = useState('Overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({ title: '', assignedTo: '', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [localNotes, setLocalNotes] = useState('');
  const [hasUnsavedNotes, setHasUnsavedNotes] = useState(false);

  const lead = leads.find(l => l.id === id || l._id === id);
  const district = districts.find(d => (d.id || d._id) === lead?.districtId);
  const assignedUser = users.find(u => (u.id || u._id) === lead?.assignedTo);
  const leadTasks = tasks.filter(t => t.leadId === id);
  const leadMeetings = meetings.filter(m => m.leadId === id);

  // Sync local notes when lead data loads or changes from server
  React.useEffect(() => {
    if (lead && !hasUnsavedNotes) {
      setLocalNotes(lead.notes || '');
    }
  }, [lead, hasUnsavedNotes]);

  if (!lead) return <div className="page-body">Lead not found</div>;

  const handleGenerateStrategy = async () => {
    const { generateSalesStrategy } = await import('../../services/ai');
    setIsAiLoading(true);
    const res = await generateSalesStrategy({ ...lead, districtName: district?.name });
    setAiStrategy(res);
    setIsAiLoading(false);
  };

  const handleStageChange = (newStage) => {
    let payload = { ...lead, stage: newStage };
    if (newStage === 'Follow Up') {
      const date = prompt('Enter Follow Up Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
      if (!date) return; // Cancelled
      payload.followUpDate = date;
    }
    if (newStage !== 'Follow Up') {
      payload.followUpDate = '';
    }
    updateLead(lead.id || lead._id, payload, lead.stage);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 40, alignItems: 'flex-end' }}>
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm mb-6" onClick={() => navigate('/leads')} style={{ paddingLeft: 0, opacity: 0.7 }}>
            <ChevronLeft size={16} /> Back to Leads
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '20px', background: 'var(--brand-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 24, fontWeight: 800, color: 'white',
              boxShadow: '0 8px 24px rgba(255, 107, 0, 0.2)'
            }}>
              {lead.firstName[0]}{lead.lastName[0]}
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>{lead.firstName} {lead.lastName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span className={`badge ${STAGE_BADGE[lead.stage]}`} style={{ padding: '6px 16px', fontSize: 13 }}>{lead.stage}</span>
                <div style={{ width: 1, height: 16, background: 'var(--border-color)' }}></div>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Registered {new Date(lead.createdDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 12 }}>
          {can('edit') && (
            <button className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: 8 }} onClick={() => setShowEdit(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
            <button 
              className="btn btn-secondary" 
              style={{ color: 'var(--brand-primary)', padding: 10 }} 
              title="Share Qualification Form"
              onClick={() => {
                const url = `${window.location.protocol}//${window.location.host}/qualify/${lead.id || lead._id}`;
                navigator.clipboard.writeText(url);
                toast("Lead-specific link copied!", "success");
              }}
            >
              <Share2 size={20} />
            </button>
            <button className="btn btn-ghost" style={{ color: '#ef4444', padding: 10 }} onClick={() => { if (confirm('Delete lead?')) { deleteLead(lead.id || lead._id); navigate('/leads'); } }}>
              <Trash2 size={20} />
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 40 }}>
        <div className="flex-col gap-8">
          {/* Quick Stage Actions */}
          <div className="glass-card" style={{ padding: 24, background: 'var(--bg-white)', border: '1px solid var(--border-color)' }}>
            <div className="page-subtitle" style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Journey Stage</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
              {STAGES.map((s, idx) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <button 
                    className={`chip ${lead.stage === s ? 'active' : ''}`}
                    onClick={() => handleStageChange(s)}
                    style={{ 
                      padding: '8px 16px', borderRadius: 8, border: '1px solid ' + (lead.stage === s ? 'var(--brand-primary)' : 'var(--border-color)'),
                      background: lead.stage === s ? 'var(--brand-primary)' : 'white',
                      color: lead.stage === s ? 'white' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                      boxShadow: lead.stage === s ? '0 4px 12px rgba(255,107,0,0.2)' : 'none'
                    }}
                  >
                    {s}
                  </button>
                  {idx < STAGES.length - 1 && (
                    <div style={{ width: 16, height: 1, background: 'var(--border-color)', margin: '0 4px' }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-in">
            {activeTab === 'Overview' && (
              <div className="grid gap-8">
                <div className="glass-card" style={{ padding: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h4 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Master Profile</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div className="text-muted" style={{ fontSize: 11, fontWeight: 700 }}>ENGAGEMENT</div>
                       <div style={{ width: 100, height: 8, background: 'var(--bg-page)', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${lead.score}%`, background: 'var(--brand-primary)', borderRadius: 10 }} />
                       </div>
                       <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{lead.score}</span>
                    </div>
                  </div>

                  <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                        <Phone size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Contact Number
                      </div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.phone}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                        <Mail size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email Address
                      </div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.email || '—'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                        <MapPin size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Territory / District
                      </div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{district?.name || 'Pending'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                        <Briefcase size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Current Profession
                      </div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.profession || '—'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                        <Wallet size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Investment Capacity
                      </div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.investmentCapacity}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                        <User size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Assigned Expert
                      </div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{assignedUser?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                </div>

                <div className="tabs" style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
                  {['AI Strategy', 'Qualification', 'Tasks', 'Webinars & Meetings', 'Notes'].map(t => (
                    <button 
                      key={t} 
                      className={`tab-btn ${activeTab === t ? 'active' : t === 'Overview' ? 'hidden' : ''}`} 
                      onClick={() => setActiveTab(t)}
                      style={{ 
                        background: 'none', border: 'none', color: activeTab === t ? 'var(--brand-primary)' : 'var(--text-muted)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        padding: '12px 0', position: 'relative'
                      }}
                    >
                      {t}
                      {activeTab === t && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--brand-primary)', borderRadius: 100 }} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'AI Strategy' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700 }}>AI Strategic Advisor</h4>
                  {!aiStrategy && !isAiLoading && (
                    <button className="btn btn-primary" onClick={handleGenerateStrategy}>Generate Plan</button>
                  )}
                  {aiStrategy && (
                    <button className="btn btn-ghost" onClick={handleGenerateStrategy} disabled={isAiLoading}>
                      <RefreshCw size={16} className={isAiLoading ? 'animate-spin' : ''} /> Regenerate
                    </button>
                  )}
                </div>
                <div>
                  {isAiLoading && <div className="text-muted" style={{ textAlign: 'center', padding: '60px' }}>AI Advisor is analyzing lead data...</div>}
                  {!aiStrategy && !isAiLoading && (
                    <div className="text-muted" style={{ textAlign: 'center', padding: '60px' }}>
                      Analyze {lead.firstName}'s profile to generate a targeted sales strategy and script.
                    </div>
                  )}
                  {aiStrategy && !isAiLoading && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 16, border: '1px solid var(--glass-border)',
                      whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: '1.8', color: 'var(--text-primary)'
                    }}>
                      {aiStrategy}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Webinars & Meetings' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700 }}>Meetings & Events</h4>
                  <button className="btn btn-primary" onClick={() => {
                    createMeeting({ 
                      leadId: lead.id || lead._id, 
                      eventType: '1:1 Meeting', 
                      scheduledDateTime: new Date(Date.now() + 172800000).toISOString(),
                      googleMeetLink: 'https://meet.google.com/new'
                    });
                  }}>
                    <Video size={18} /> Schedule One-on-One
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {leadMeetings.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: 20 }}>No sessions scheduled.</p>}
                  {leadMeetings.map(meeting => {
                    const isPassed = new Date(meeting.scheduledDateTime) < new Date();
                    return (
                      <div key={meeting.id} className="glass-card" style={{ 
                        padding: 16, background: 'rgba(255,255,255,0.03)', border: 'none', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        opacity: isPassed ? 0.4 : 1,
                        pointerEvents: isPassed ? 'none' : 'auto'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{meeting.eventType}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{new Date(meeting.scheduledDateTime).toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          {meeting.googleMeetLink && !isPassed && (
                            <a href={meeting.googleMeetLink.startsWith('http') ? meeting.googleMeetLink : `https://${meeting.googleMeetLink}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '8px 16px' }}>
                              Join Now
                            </a>
                          )}
                          <button onClick={() => { if(confirm('Delete meeting?')) deleteMeeting(meeting.id || meeting._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444', pointerEvents: 'auto' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'Tasks' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700 }}>Related Tasks</h4>
                  <button className="btn btn-primary" onClick={() => {
                    setEditingTask(null);
                    setTaskFormData({ title: '', assignedTo: lead.assignedTo || currentUser.id, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
                    setShowTaskModal(true);
                  }}>
                    <Plus size={18} /> New Task
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {leadTasks.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: 20 }}>No tasks for this lead.</p>}
                  {leadTasks.map((task, i) => {
                    const isOverdue = !task.done && new Date(task.dueDate) < new Date();
                    return (
                      <div key={task.id || task._id} className="glass-card" style={{ 
                        padding: '16px 20px', 
                        display: 'flex', alignItems: 'center', gap: 20,
                        opacity: task.done ? 0.7 : 1,
                        borderLeft: task.done ? '4px solid #10b981' : isOverdue ? '4px solid #ef4444' : '1px solid var(--glass-border)',
                        transition: 'all 0.3s'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <div style={{ 
                                  fontSize: 15, fontWeight: 700, 
                                  textDecoration: task.done ? 'line-through' : 'none',
                                  color: task.done ? 'var(--text-muted)' : 'var(--text-primary)'
                                }}>{task.title}</div>
                                <span style={{ 
                                  fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
                                  background: task.done ? 'rgba(16, 185, 129, 0.1)' : isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                  color: task.done ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b',
                                  border: '1px solid currentColor'
                                }}>
                                  {task.done ? 'Done' : isOverdue ? 'Overdue' : 'Pending'}
                                </span>
                              </div>
                              <div className="text-muted" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {users.find(u => (u.id || u._id) === task.assignedTo)?.name || 'Unassigned'}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <button 
                                onClick={() => toggleTask(task.id || task._id)}
                                className={`btn ${task.done ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ 
                                  padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6,
                                  background: task.done ? 'var(--glass-border)' : '#10b981',
                                  borderColor: task.done ? 'var(--glass-border)' : '#10b981',
                                  color: task.done ? 'var(--text-primary)' : 'white',
                                  minWidth: 100
                                }}
                              >
                                {task.done ? 'Reopen' : 'Complete'}
                              </button>

                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTask(task);
                                  setTaskFormData({ title: task.title, assignedTo: task.assignedTo, dueDate: new Date(task.dueDate).toISOString().split('T')[0] });
                                  setShowTaskModal(true);
                                }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand-primary)' }}>
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete task?')) deleteTask(task.id || task._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'Notes' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Lead Notes</h4>
                  {hasUnsavedNotes && (
                    <button 
                      className="btn btn-primary animate-in fade-in" 
                      style={{ padding: '6px 16px', fontSize: 12 }}
                      onClick={async () => {
                        await updateLead(lead.id || lead._id, { ...lead, notes: localNotes }, lead.stage);
                        setHasUnsavedNotes(false);
                        toast("Notes saved successfully", "success");
                      }}
                    >
                      Save Notes
                    </button>
                  )}
                </div>
                <textarea 
                  className="glass-input" 
                  value={localNotes} 
                  onChange={(e) => {
                    setLocalNotes(e.target.value);
                    setHasUnsavedNotes(true);
                  }}
                  placeholder="Write observations, preferences, or call summaries..."
                  style={{ minHeight: 400, width: '100%', lineHeight: '1.6', border: hasUnsavedNotes ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)' }}
                />
                {hasUnsavedNotes && (
                  <p style={{ marginTop: 12, fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600 }}>
                    You have unsaved changes in your notes.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'Qualification' && (
              <div className="animate-in">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ fontSize: 13, gap: 8 }}
                    onClick={() => {
                      const url = `${window.location.protocol}//${window.location.host}/qualify/${lead.id || lead._id}`;
                      navigator.clipboard.writeText(url);
                      toast("Public link copied to clipboard!", "success");
                    }}
                  >
                    <Share2 size={16} /> Share Public Form
                  </button>
                </div>
                <QualificationForm leadId={lead.id || lead._id} toast={toast} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Mini Profile */}
        <div className="flex-col gap-8">
          <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-page) 100%)' }}>
            <div className="text-muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 20, textTransform: 'uppercase' }}>Performance Metrics</div>
            
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Engagement Score</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-primary)' }}>{lead.score}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>%</span></div>
              </div>
              <div style={{ height: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${lead.score}%`, 
                  background: 'linear-gradient(90deg, var(--brand-primary-light) 0%, var(--brand-primary) 100%)', 
                  borderRadius: 10,
                  transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            </div>

            <div style={{ padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
               <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>QUICK NOTES</div>
               <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>
                 "Customer interested in 500sqft territory in Hyderabad..."
               </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Priority Actions</h4>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', background: 'var(--brand-primary-light)', padding: '2px 10px', borderRadius: 100 }}>
                {leadTasks.filter(t => !t.done).length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {leadTasks.filter(t => !t.done).slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', gap: 12, fontSize: 13, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                </div>
              ))}
              {leadTasks.filter(t => !t.done).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                   <CheckCircle size={32} style={{ color: 'var(--brand-primary)', opacity: 0.2, marginBottom: 12 }} />
                   <p className="text-muted" style={{ fontSize: 12 }}>All tasks completed!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <LeadForm 
          lead={lead} 
          onClose={() => setShowEdit(false)} 
        />
      )}

      {showTaskModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 450, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="btn btn-secondary" style={{ padding: 4, minWidth: 'auto' }} onClick={() => setShowTaskModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form style={{ padding: '32px' }} onSubmit={async (e) => {
              e.preventDefault();
              const payload = { ...taskFormData, leadId: lead.id || lead._id };
              if (editingTask) {
                await updateTask(editingTask.id || editingTask._id, payload);
              } else {
                await createTask(payload);
              }
              setShowTaskModal(false);
            }}>
              <div className="form-group mb-6">
                <label className="form-label">Task Title</label>
                <input required className="form-input" value={taskFormData.title} onChange={e => setTaskFormData({...taskFormData, title: e.target.value})} placeholder="What needs to be done?" />
              </div>
              <div className="form-group mb-6">
                <label className="form-label">Due Date</label>
                <input required type="date" className="form-input" value={taskFormData.dueDate} onChange={e => setTaskFormData({...taskFormData, dueDate: e.target.value})} />
              </div>
              <div className="form-group mb-8">
                <label className="form-label">Assigned To</label>
                <select className="form-input" value={taskFormData.assignedTo} onChange={e => setTaskFormData({...taskFormData, assignedTo: e.target.value})}>
                  {users.map(u => (
                    <option key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
