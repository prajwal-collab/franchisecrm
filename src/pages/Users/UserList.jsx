import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Trash2, X, Send, CheckSquare, Square, Edit2 } from 'lucide-react';
import { usersDB, exportToCSV } from '../../services/db';
import TableToolbar from '../../components/TableToolbar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function UserList() {
  const { can } = useAuth();
  const { toast } = useApp();
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'SDR',
    password: 'password123' // Default for now
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await usersDB.getAll();
    setUsers(data);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const updated = await usersDB.update(editingUser.id || editingUser._id, newUser);
      if (updated) {
        setShowAdd(false);
        setEditingUser(null);
        setNewUser({ name: '', email: '', role: 'SDR', password: 'password123' });
        loadUsers();
        toast('User updated successfully', 'success');
      }
    } else {
      const res = await usersDB.create(newUser);
      if (res) {
        setShowAdd(false);
        setNewUser({ name: '', email: '', role: 'SDR', password: 'password123' });
        loadUsers();
        if (res.inviteSent) {
          toast(`Success! Invitation email sent to ${newUser.email}`, 'success');
        } else {
          toast(`User created, but invitation email failed. Check SMTP settings.`, 'warning');
        }
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const success = await usersDB.delete(id);
    if (success) {
      setUsers(prev => prev.filter(u => (u.id || u._id) !== id));
      toast('User deleted successfully', 'success');
    } else {
      toast('Failed to delete user from server. Please check your connection.', 'error');
    }
  };

  if (!can('manage_users')) return <div className="p-8 text-center">Unauthorized</div>;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add team members and assign roles to manage access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <TableToolbar 
          selectedCount={selected.length}
          onEdit={() => {
            if (selected.length !== 1) return toast('Select exactly one user to edit', 'info');
            const target = users.find(u => (u.id || u._id) === selected[0]);
            if (target) {
              setEditingUser(target);
              setNewUser({ name: target.name, email: target.email, role: target.role });
              setShowAdd(true);
            }
          }}
          onDuplicate={() => toast('Cloning users is restricted.', 'error')}
          onDelete={async () => {
            if (!window.confirm(`Delete ${selected.length} users?`)) return;
            const success = await usersDB.bulkDelete(selected);
            if (success) {
              setUsers(prev => prev.filter(u => !selected.includes(u.id || u._id)));
              setSelected([]);
              toast('Users deleted successfully', 'success');
            } else {
              toast('Bulk delete failed. Some users might not have been removed.', 'error');
            }
          }}
          onPrint={() => window.print()}
          onExport={() => {
            const data = selected.length ? users.filter(u => selected.includes(u.id || u._id)) : users;
            exportToCSV(data, `users_${Date.now()}.csv`, [
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' }
            ]);
          }}
        />
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: 48, cursor: 'pointer' }} onClick={() => setSelected(selected.length === users.length && users.length > 0 ? [] : users.map(u => u.id || u._id))}>
                  {selected.length === users.length && users.length > 0 ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                </th>
                <th>Name</th>
                <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const uid = user.id || user._id;
              return (
              <tr key={uid}>
                <td onClick={(e) => { e.stopPropagation(); setSelected(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]); }}>
                  {selected.includes(uid) ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                </td>
                <td style={{ fontWeight: 700 }}>{user.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                <td>
                  <span className="badge" style={{ 
                    background: user.role === 'Admin' ? '#000' : '#f5f8fa', 
                    color: user.role === 'Admin' ? '#fff' : '#516f90',
                    fontWeight: 700
                  }}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className="badge badge-success" style={{ background: '#eafaf1', color: '#22c55e' }}>Active</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => {
                        setEditingUser(user);
                        setNewUser({ name: user.name, email: user.email, role: user.role });
                        setShowAdd(true);
                      }} 
                      title="Edit User"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={async () => {
                        const res = await usersDB.resendInvite(user.id || user._id);
                        if (res) toast(`Success! Invitation email re-sent to ${user.email}`, 'success');
                        else toast('Failed to resend invitation. Check server logs.', 'error');
                      }} 
                      title="Resend Invite"
                    >
                      <Send size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: '#ef4444' }}
                      onClick={() => handleDelete(user.id || user._id)} 
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content animate-in">
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#33475b', margin: 0 }}>{editingUser ? 'Edit User' : 'Invite New User'}</h2>
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditingUser(null); setNewUser({ name: '', email: '', role: 'SDR', password: 'password123' }) }} style={{ padding: 4, minWidth: 'auto', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '24px' }}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Full Name</label>
                <input 
                  className="form-input" 
                  required 
                  value={newUser.name} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Email Address</label>
                <input 
                  className="form-input" 
                  type="email" 
                  required 
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div style={{ marginBottom: 32 }}>
                <label className="form-label">Role</label>
                <select 
                  className="form-input" 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="SDR">SDR (Lead Management)</option>
                  <option value="Closer">Closer (Deal Closure)</option>
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                {editingUser ? 'Save Changes' : 'Send Invitation Email'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
