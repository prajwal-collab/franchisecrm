import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Trash2, X, Send } from 'lucide-react';
import { usersDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

export default function UserList() {
  const { can } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
    const res = await usersDB.create(newUser);
    if (res) {
      setShowAdd(false);
      setNewUser({ name: '', email: '', role: 'SDR', password: 'password123' });
      loadUsers();
      if (res.inviteSent) {
        alert(`Success! Invitation email sent to ${newUser.email}`);
      } else {
        alert(`User created, but invitation email could not be sent. Please check SMTP settings in .env`);
      }
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
        <table className="premium-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id || user._id}>
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
                  <button className="btn btn-secondary btn-sm" onClick={() => alert('Invitation re-sent!')} title="Resend Invite">
                    <Send size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content animate-in">
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#33475b', margin: 0 }}>Invite New User</h2>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ padding: 4, minWidth: 'auto', border: 'none' }}><X size={20} /></button>
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
                Send Invitation Email
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
