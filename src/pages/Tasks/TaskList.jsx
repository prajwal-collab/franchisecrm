import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Square, Clock, AlertCircle, 
  Trash2, Plus, Calendar, Filter, User, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TaskList() {
  const { tasks, leads, franchisees, districts, toggleTask, deleteTask, createTask, users } = useApp();
  const { currentUser } = useAuth();

  const [filter, setFilter] = useState('pending'); // all, pending, done, overdue
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '', leadId: '', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
  const now = new Date();

  const enriched = useMemo(() => tasks.map(t => ({
    ...t,
    leadName: t.leadId ? leads.find(l => (l.id || l._id) === t.leadId)?.firstName + ' ' + leads.find(l => (l.id || l._id) === t.leadId)?.lastName : null,
    franchiseeName: t.franchiseeId ? franchisees.find(f => (f.id || f._id) === t.franchiseeId)?.name : null,
    assigneeName: users.find(u => (u.id || u._id) === t.assignedTo)?.name || 'Unassigned'
  })), [tasks, leads, franchisees, users]);

  const filtered = useMemo(() => {
    let r = enriched;
    if (filter === 'pending') r = r.filter(t => !t.done);
    if (filter === 'done') r = r.filter(t => t.done);
    if (filter === 'overdue') r = r.filter(t => !t.done && new Date(t.dueDate) < now);
    
    return r.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [enriched, filter]);

  const stats = {
    pending: enriched.filter(t => !t.done).length,
    overdue: enriched.filter(t => !t.done && new Date(t.dueDate) < now).length,
    done: enriched.filter(t => t.done).length
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div className="page-header-left">
          <div className="page-title" style={{ fontSize: 28, fontWeight: 800 }}>Tasks</div>
          <div className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Manage your workspace items and automated reminders</div>
        </div>
        <div className="page-header-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => {
            setNewTask({ ...newTask, assignedTo: currentUser.id });
            setShowAdd(true);
          }}>
            <Plus size={18} /> Create New Task
          </button>
        </div>
      </div>

      <div className="kpi-grid mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <div className={`glass-card ${filter === 'pending' ? 'active' : ''}`} style={{ 
          cursor: 'pointer', padding: 24,
          borderLeft: filter === 'pending' ? '4px solid var(--brand-primary)' : '1px solid var(--glass-border)'
        }} onClick={() => setFilter('pending')}>
          <div className="kpi-card-value" style={{ fontSize: 32, fontWeight: 800 }}>{stats.pending}</div>
          <div className="kpi-card-label" style={{ color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase' }}>Pending</div>
        </div>
        <div className={`glass-card ${filter === 'overdue' ? 'active' : ''}`} style={{ 
          cursor: 'pointer', padding: 24,
          borderLeft: filter === 'overdue' ? '4px solid #ef4444' : '1px solid var(--glass-border)'
        }} onClick={() => setFilter('overdue')}>
          <div className="kpi-card-value" style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{stats.overdue}</div>
          <div className="kpi-card-label" style={{ color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase' }}>Overdue</div>
        </div>
        <div className={`glass-card ${filter === 'done' ? 'active' : ''}`} style={{ 
          cursor: 'pointer', padding: 24,
          borderLeft: filter === 'done' ? '4px solid #10b981' : '1px solid var(--glass-border)'
        }} onClick={() => setFilter('done')}>
          <div className="kpi-card-value" style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{stats.done}</div>
          <div className="kpi-card-label" style={{ color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase' }}>Completed</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <CheckSquare size={48} style={{ color: 'var(--glass-border)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>All Clear!</h3>
            <p style={{ color: 'var(--text-muted)' }}>No tasks match the selected filter.</p>
          </div>
        )}
        {filtered.map((task, i) => {
          const isOverdue = !task.done && new Date(task.dueDate) < now;
          return (
            <div key={task.id} className="glass-card" style={{ 
              padding: '16px 24px', 
              display: 'flex', alignItems: 'center', gap: 20,
              animationDelay: `${i * 0.05}s`,
              opacity: task.done ? 0.6 : 1,
              borderLeft: isOverdue ? '4px solid #ef4444' : task.done ? '4px solid #10b981' : '1px solid var(--glass-border)'
            }}>
              <div 
                onClick={() => toggleTask(task.id)}
                style={{ 
                  width: 24, height: 24, borderRadius: 6, border: '2px solid var(--glass-border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: task.done ? 'var(--brand-primary)' : 'transparent',
                  borderColor: task.done ? 'var(--brand-primary)' : 'var(--glass-border)',
                  transition: 'all 0.2s'
                }}
              >
                {task.done && <Plus size={16} color="white" style={{ transform: 'rotate(45deg)' }} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: 15, fontWeight: 600, 
                    textDecoration: task.done ? 'line-through' : 'none',
                    color: task.done ? 'var(--text-muted)' : '#33475b'
                  }}>{task.title}</div>
                  <button onClick={() => deleteTask(task.id || task._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                  {(task.leadName || task.franchiseeName) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <User size={14} />
                      {task.leadName || task.franchiseeName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#33475b', margin: 0 }}>Create New Task</h2>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ padding: 4, minWidth: 'auto', border: 'none' }}><X size={20} /></button>
            </div>
            <form style={{ padding: '24px' }} onSubmit={(e) => {
              e.preventDefault();
              createTask(newTask);
              setShowAdd(false);
              setNewTask({ title: '', assignedTo: currentUser.id, leadId: '', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
            }}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Task Title</label>
                <input 
                  className="form-input" 
                  required 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="e.g. Call back Ramesh"
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Due Date</label>
                <input 
                  className="form-input" 
                  type="date"
                  required 
                  value={newTask.dueDate} 
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              <div style={{ marginBottom: 32 }}>
                <label className="form-label">Related Lead (Optional)</label>
                <select 
                  className="form-input" 
                  value={newTask.leadId} 
                  onChange={e => setNewTask({...newTask, leadId: e.target.value})}
                >
                  <option value="">None</option>
                  {leads.map(l => {
                    const dName = districts.find(d => (d.id || d._id) === l.districtId)?.name || 'Unknown';
                    return (
                      <option key={l.id || l._id} value={l.id || l._id}>
                        {l.firstName} {l.lastName} ({dName})
                      </option>
                    );
                  })}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
