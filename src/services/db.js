/**
 * db.js - Smart Persistence Layer
 * Attempts to use the MongoDB Backend, falls back to LocalStorage if offline.
 */

const API_BASE = '/api';

// Helper to check if backend is reachable
async function isBackendUp() {
  try {
    const res = await fetch(`${API_BASE}/districts`, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ---- FALLBACK LOCALSTORAGE SERVICE ----
const localStore = (key) => ({
  getAll: () => JSON.parse(localStorage.getItem(`ej_${key}`) || '[]'),
  save: (data) => localStorage.setItem(`ej_${key}`, JSON.stringify(data)),
  getById: (id) => JSON.parse(localStorage.getItem(`ej_${key}`) || '[]').find(x => (x.id || x._id) === id),
});

// ---- SMART WRAPPER ----
const smartRequest = async (path, method = 'GET', body = null, localKey = null) => {
  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) throw new Error('Backend failed');
    return res.json();
  } catch (err) {
    console.warn(`⚠️ Backend redirected to LocalStorage for ${path}`);
    if (localKey && method === 'GET') {
      return JSON.parse(localStorage.getItem(`ej_${localKey}`) || '[]');
    }
    // For writes, just perform on local for now
    return null;
  }
};

export const leadsDB = {
  getAll: async (user) => {
    let leads = await smartRequest('/leads', 'GET', null, 'leads');
    if (user?.role === 'SDR') return leads.filter(l => l.assignedTo === user.id);
    return leads;
  },
  create: async (data) => {
    const res = await smartRequest('/leads', 'POST', data);
    if (!res) {
      const leads = JSON.parse(localStorage.getItem('ej_leads') || '[]');
      const newLead = { ...data, id: 'temp_' + Date.now(), createdDate: new Date().toISOString() };
      localStorage.setItem('ej_leads', JSON.stringify([newLead, ...leads]));
      return newLead;
    }
    return res;
  },
  update: async (id, updates) => {
    const res = await smartRequest(`/leads/${id}`, 'PUT', updates);
    if (!res) {
      const leads = JSON.parse(localStorage.getItem('ej_leads') || '[]');
      const idx = leads.findIndex(l => (l.id || l._id) === id);
      if (idx !== -1) {
        leads[idx] = { ...leads[idx], ...updates };
        localStorage.setItem('ej_leads', JSON.stringify(leads));
      }
    }
    return res;
  },
  delete: async (id) => {
    await smartRequest(`/leads/${id}`, 'DELETE');
    const leads = JSON.parse(localStorage.getItem('ej_leads') || '[]');
    localStorage.setItem('ej_leads', JSON.stringify(leads.filter(l => (l.id || l._id) !== id)));
  },
  bulkCreate: async (records) => {
    const res = await smartRequest('/leads/bulk', 'POST', records);
    if (!res) {
      const existing = JSON.parse(localStorage.getItem('ej_leads') || '[]');
      localStorage.setItem('ej_leads', JSON.stringify([...records, ...existing]));
    }
    return res;
  }
};

export const districtsDB = {
  getAll: async () => await smartRequest('/districts', 'GET', null, 'districts'),
  update: async (id, updates) => await smartRequest(`/districts/${id}`, 'PUT', updates),
  markSold: async (id, franchiseeId) => {
    return await smartRequest(`/districts/${id}`, 'PUT', { 
      status: 'Sold', 
      soldDate: new Date().toISOString(), 
      franchiseeId 
    });
  },
  bulkCreate: async (records) => {
    const res = await smartRequest('/districts/bulk', 'POST', records);
    if (!res) {
      const existing = JSON.parse(localStorage.getItem('ej_districts') || '[]');
      localStorage.setItem('ej_districts', JSON.stringify([...records, ...existing]));
    }
    return res;
  }
};

export const franchiseesDB = {
  getAll: async () => await smartRequest('/franchisees', 'GET', null, 'franchisees'),
  create: async (data) => await smartRequest('/franchisees', 'POST', data),
  update: async (id, updates) => {
    const res = await smartRequest(`/franchisees/${id}`, 'PUT', updates);
    if (!res) {
      const stored = JSON.parse(localStorage.getItem('ej_franchisees') || '[]');
      const idx = stored.findIndex(f => (f.id || f._id) === id);
      if (idx !== -1) {
        stored[idx] = { ...stored[idx], ...updates };
        localStorage.setItem('ej_franchisees', JSON.stringify(stored));
      }
    }
    return res;
  },
  delete: async (id) => {
    await smartRequest(`/franchisees/${id}`, 'DELETE');
    const stored = JSON.parse(localStorage.getItem('ej_franchisees') || '[]');
    localStorage.setItem('ej_franchisees', JSON.stringify(stored.filter(f => (f.id || f._id) !== id)));
  },
  bulkDelete: async (ids) => {
    for (const id of ids) {
      await smartRequest(`/franchisees/${id}`, 'DELETE');
    }
    const stored = JSON.parse(localStorage.getItem('ej_franchisees') || '[]');
    localStorage.setItem('ej_franchisees', JSON.stringify(stored.filter(f => !ids.includes(f.id || f._id))));
  },
  bulkCreate: async (records) => {
    const res = await smartRequest('/franchisees/bulk', 'POST', records);
    if (!res) {
      const existing = JSON.parse(localStorage.getItem('ej_franchisees') || '[]');
      localStorage.setItem('ej_franchisees', JSON.stringify([...records, ...existing]));
    }
    return res;
  }
};

export const tasksDB = {
  getAll: async () => await smartRequest('/tasks', 'GET', null, 'tasks'),
  create: async (data) => await smartRequest('/tasks', 'POST', data),
  update: async (id, updates) => await smartRequest(`/tasks/${id}`, 'PUT', updates),
  delete: async (id) => await smartRequest(`/tasks/${id}`, 'DELETE'),
};

export const meetingsDB = {
  getAll: async () => await smartRequest('/meetings', 'GET', null, 'meetings'),
  create: async (data) => await smartRequest('/meetings', 'POST', data),
};

export const usersDB = {
  getAll: async () => await smartRequest('/users', 'GET', null, 'users'),
  create: async (data) => await smartRequest('/users', 'POST', data),
  resendInvite: async (userId) => await smartRequest(`/users/${userId}/resend-invite`, 'POST'),
  authenticate: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) return await res.json();
      throw new Error('Backend authentication failed');
    } catch (e) {
      const { DEMO_USERS } = await import('../data/initialData');
      const localUsers = JSON.parse(localStorage.getItem('ej_users') || '[]');
      const all = [...DEMO_USERS, ...localUsers];
      return all.find(u => u.email === email && u.password === password) || null;
    }
  }
};

export async function getNextSDR() {
  const res = await smartRequest('/users/next-sdr', 'GET');
  if (res) return res;
  
  // Fallback
  const users = JSON.parse(localStorage.getItem('ej_users') || '[]');
  const sdrs = users.filter(u => u.role === 'SDR');
  if (!sdrs.length) return null;
  const counter = parseInt(localStorage.getItem('ej_sdr_counter') || '0');
  const sdr = sdrs[counter % sdrs.length];
  localStorage.setItem('ej_sdr_counter', (counter + 1).toString());
  return sdr;
}

// Utilities
export function exportToCSV(data, filename, columns) {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(item => columns.map(c => {
    const val = item[c.key] || '';
    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
  }).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    header.forEach((h, i) => { if (values[i] !== undefined) obj[h] = values[i]; });
    return obj;
  });
}

export function downloadTemplate(headers, filename) {
  const content = headers.join(',') + '\n';
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}
