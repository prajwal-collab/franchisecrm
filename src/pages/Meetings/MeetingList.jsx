import React, { useState, useMemo } from 'react';
import { 
  Video, Calendar, Plus, Search, 
  ExternalLink, Trash2, Clock, User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { EVENT_TYPES } from '../../data/initialData';

export default function MeetingList() {
  const { meetings, leads, createMeeting, deleteMeeting, toast } = useApp();
  const { can } = useAuth();
  
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    leadId: '',
    eventType: 'Webinar',
    scheduledDateTime: '',
    googleMeetLink: ''
  });

  const enriched = useMemo(() => meetings.map(m => ({
    ...m,
    leadName: leads.find(l => (l.id || l._id) === m.leadId)?.firstName + ' ' + leads.find(l => (l.id || l._id) === m.leadId)?.lastName || 'Unknown'
  })), [meetings, leads]);

  const filtered = useMemo(() => {
    return enriched.filter(m => m.leadName.toLowerCase().includes(search.toLowerCase()))
                   .sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime));
  }, [enriched, search]);

  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!newMeeting.leadId || !newMeeting.scheduledDateTime) {
      toast('Please fill in lead and date/time', 'error');
      return;
    }
    const finalMeeting = {
      ...newMeeting,
      scheduledDateTime: new Date(newMeeting.scheduledDateTime).toISOString()
    };
    
    createMeeting(finalMeeting);
    setShowAdd(false);
    setNewMeeting({ leadId: '', eventType: 'Webinar', scheduledDateTime: '', googleMeetLink: '' });
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div className="page-header-left">
          <div className="page-title" style={{ fontSize: 28, fontWeight: 800 }}>Webinars & Meetings</div>
          <div className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Schedule and track upcoming lead interactions</div>
        </div>
        <div className="page-header-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="glass-input" style={{ flex: 1, maxWidth: 300, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            placeholder="Search by lead name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      <div className="grid gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {filtered.map(meeting => (
          <div key={meeting.id || meeting._id} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${meeting.eventType === 'Webinar' ? 'badge-webinar-reg' : 'badge-1-1'}`}>
                  {meeting.eventType}
                </span>
                <span className="text-muted" style={{ fontSize: 11 }}>{meeting.id || meeting._id}</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteMeeting(meeting.id || meeting._id)}>
                <Trash2 size={13} color="var(--brand-danger)" />
              </button>
            </div>
            
            <h3 style={{ marginBottom: 4, fontSize: 16 }}>{meeting.leadName}</h3>
            <div className="flex-col gap-2 mb-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Calendar size={14} /> {new Date(meeting.scheduledDateTime).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Clock size={14} /> {new Date(meeting.scheduledDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {meeting.googleMeetLink && (
              <a href={meeting.googleMeetLink.startsWith('http') ? meeting.googleMeetLink : `https://${meeting.googleMeetLink}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%' }}>
                <Video size={14} /> Join Call
              </a>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="login-glass" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <div className="modal-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
              <span className="modal-title" style={{ fontSize: 18, fontWeight: 700 }}>Schedule New Meeting</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form onSubmit={handleAddMeeting} className="modal-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Select Lead</label>
                <select 
                  className="glass-input" 
                  style={{ width: '100%' }}
                  value={newMeeting.leadId} 
                  onChange={e => setNewMeeting({...newMeeting, leadId: e.target.value})}
                >
                  <option value="" style={{ background: 'var(--bg-deep)' }}>Select a Lead</option>
                  {leads.map(l => <option key={l.id || l._id} value={l.id || l._id} style={{ background: 'var(--bg-deep)' }}>{l.firstName} {l.lastName}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Event Type</label>
                <select 
                  className="glass-input" 
                  style={{ width: '100%' }}
                  value={newMeeting.eventType} 
                  onChange={e => setNewMeeting({...newMeeting, eventType: e.target.value})}
                >
                  {EVENT_TYPES.map(et => <option key={et} value={et} style={{ background: 'var(--bg-deep)' }}>{et}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Date & Time</label>
                <input 
                  className="glass-input" 
                  style={{ width: '100%' }}
                  type="datetime-local" 
                  value={newMeeting.scheduledDateTime}
                  onChange={e => setNewMeeting({...newMeeting, scheduledDateTime: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Meeting Link</label>
                <input 
                  className="glass-input" 
                  style={{ width: '100%' }}
                  placeholder="https://meet.google.com/..." 
                  value={newMeeting.googleMeetLink}
                  onChange={e => setNewMeeting({...newMeeting, googleMeetLink: e.target.value})}
                />
              </div>
            </form>
            <div className="modal-footer" style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddMeeting}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
