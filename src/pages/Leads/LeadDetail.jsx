import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Edit2, Trash2, Calendar, Phone, Mail, 
  MapPin, User, Briefcase, Wallet, History, MessageSquare,
  Plus, Video, CheckCircle, Clock, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import LeadForm from './LeadForm';
import { STAGES } from '../../data/initialData';

const STAGE_BADGE = {
  'New Lead': 'badge-new-lead', 'Contacted': 'badge-contacted', 'Interested': 'badge-interested',
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
  const [aiStrategy, setAiStrategy] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const lead = leads.find(l => (l.id || l._id) === id);
  const district = districts.find(d => (d.id || d._id) === lead?.districtId);
  const assignedUser = users.find(u => (u.id || u._id) === lead?.assignedTo);
  const leadTasks = tasks.filter(t => t.leadId === id);
  const leadMeetings = meetings.filter(m => m.leadId === id);

  if (!lead) return <div className="page-body">Lead not found</div>;

  const handleGenerateStrategy = async () => {
    const { generateSalesStrategy } = await import('../../services/ai');
    setIsAiLoading(true);
    const res = await generateSalesStrategy({ ...lead, districtName: district?.name });
    setAiStrategy(res);
    setIsAiLoading(false);
  };

  const handleStageChange = (newStage) => {
    updateLead(lead.id || lead._id, { ...lead, stage: newStage }, lead.stage);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/leads')} style={{ paddingLeft: 0, opacity: 0.7 }}>
            <ChevronLeft size={16} /> Back to Leads
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 className="page-title" style={{ fontSize: 32, fontWeight: 800 }}>{lead.firstName} {lead.lastName}</h1>
            <span className={`badge ${STAGE_BADGE[lead.stage]}`}>{lead.stage}</span>
          </div>
          <div className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: 4 }}>ID: {lead.id || lead._id} • Registered {new Date(lead.createdDate).toLocaleDateString()}</div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 12 }}>
          {can('edit') && (
            <button className="sidebar-item" style={{ width: 'auto', background: 'var(--glass-bg)', padding: '8px 16px' }} onClick={() => setShowEdit(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
          {can('delete') && (
            <button className="btn btn-ghost" style={{ color: '#ef4444' }} onClick={() => { if (confirm('Delete lead?')) { deleteLead(lead.id || lead._id); navigate('/leads'); } }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 32 }}>
        <div className="flex-col gap-6">
          {/* Quick Stage Actions */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="page-subtitle" style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Workflow Stage</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {STAGES.map(s => (
                <button 
                  key={s} 
                  className={`chip ${lead.stage === s ? 'active' : ''}`}
                  onClick={() => handleStageChange(s)}
                  style={{ 
                    padding: '8px 16px', borderRadius: 100, border: '1px solid var(--glass-border)',
                    background: lead.stage === s ? 'var(--brand-primary)' : 'var(--glass-bg)',
                    color: lead.stage === s ? 'white' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="tabs" style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
            {['Overview', 'AI Strategy', 'Tasks', 'Webinars & Meetings', 'Notes'].map(t => (
              <button 
                key={t} 
                className={`tab-btn ${activeTab === t ? 'active' : ''}`} 
                onClick={() => setActiveTab(t)}
                style={{ 
                  background: 'none', border: 'none', color: activeTab === t ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  padding: '4px 0', position: 'relative'
                }}
              >
                {t}
                {activeTab === t && <div style={{ position: 'absolute', bottom: -17, left: 0, right: 0, height: 2, background: 'var(--brand-primary)' }} />}
              </button>
            ))}
          </div>

          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            {activeTab === 'Overview' && (
              <div className="grid gap-6">
                <div className="glass-card" style={{ padding: 24 }}>
                  <h4 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Lead Profile</h4>
                  <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>PHONE</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.phone}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>EMAIL</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.email || '—'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>DISTRICT</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{district?.name || 'Pending'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>PROFESSION</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.profession || '—'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>INVESTMENT</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.investmentCapacity}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>SOURCE</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{lead.source}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                  <h4 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>System Assignment</h4>
                  <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>ENGAGEMENT SCORE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--glass-border)', borderRadius: 10 }}>
                          <div style={{ height: '100%', width: `${lead.score}%`, background: 'var(--brand-primary)', borderRadius: 10 }} />
                        </div>
                        <span style={{ fontWeight: 800 }}>{lead.score}</span>
                      </div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>ASSIGNED EXPERT</div>
                      <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{assignedUser?.name || 'Unassigned'}</div>
                    </div>
                  </div>
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
                  {leadTasks.map(task => (
                    <div key={task.id} className="glass-card" style={{ 
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16,
                      opacity: task.done ? 0.6 : 1, borderLeft: task.done ? '4px solid #10b981' : '1px solid var(--glass-border)'
                    }} onClick={() => toggleTask(task.id)}>
                      <div style={{ 
                        width: 20, height: 20, borderRadius: 4, border: '2px solid var(--glass-border)',
                        background: task.done ? 'var(--brand-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {task.done && <CheckCircle size={14} color="white" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>Due: {new Date(task.dueDate).toLocaleDateString()} • {users.find(u => (u.id || u._id) === task.assignedTo)?.name || 'Unassigned'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => {
                              setEditingTask(task);
                              setTaskFormData({ title: task.title, assignedTo: task.assignedTo, dueDate: new Date(task.dueDate).toISOString().split('T')[0] });
                              setShowTaskModal(true);
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand-primary)' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => { if(confirm('Delete task?')) deleteTask(task.id || task._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Notes' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h4 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Lead Notes</h4>
                <textarea 
                  className="glass-input" 
                  value={lead.notes} 
                  onChange={(e) => updateLead(lead.id || lead._id, { ...lead, notes: e.target.value }, lead.stage)}
                  placeholder="Write observations, preferences, or call summaries..."
                  style={{ minHeight: 400, width: '100%', lineHeight: '1.6' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Mini Profile */}
        <div className="flex-col gap-6">
          <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '24px', background: 'var(--brand-primary)', 
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 28, fontWeight: 800, color: 'white',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
            }}>
              {lead.firstName[0]}{lead.lastName[0]}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{lead.firstName} {lead.lastName}</h3>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 24 }}>{lead.profession || 'Lead'}</p>
            
            <div style={{ textAlign: 'left', borderTop: '1px solid var(--glass-border)', paddingTop: 24 }}>
              <div className="mb-6">
                <div className="text-muted" style={{ fontSize: 10, letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Workflow Stage</div>
                <div className={`badge ${STAGE_BADGE[lead.stage]}`} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>{lead.stage}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 10, letterSpacing: '0.05em', marginBottom: 4, textTransform: 'uppercase' }}>Engagement Score</div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>{lead.score}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/100</span></div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Upcoming Tasks</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leadTasks.filter(t => !t.done).slice(0, 3).map(t => (
                <div key={t.id} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <Clock size={16} className="text-warning" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{t.title}</span>
                </div>
              ))}
              {leadTasks.filter(t => !t.done).length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>No pending tasks.</p>}
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
