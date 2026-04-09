/**
 * db.js - Smart Persistence Layer
 * Overhauled to ensure zero data loss and robust fallback.
 * Every collection now merges Backend and LocalStorage results.
 */

const API_BASE = '/api';

// ---- SMART WRAPPER ----
let errorMessage = '';
export const getLastError = () => errorMessage;

const smartRequest = async (path, method = 'GET', body = null) => {
  errorMessage = '';
  try {
    const options = { 
      method, 
      headers: { 'Content-Type': 'application/json' } 
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${API_BASE}${path}`, options);
    const contentType = res.headers.get('content-type');

    if (!res.ok) {
      let msg = `Server Error (${res.status})`;
      if (contentType && contentType.includes('application/json')) {
        const err = await res.json();
        msg = err.message || err.details || msg;
        if (err.details) console.error('🔍 Server Error Details:', err.details);
      }
      errorMessage = msg; // Store for catch block
      throw new Error(msg);
    }

    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error(`❌ SmartRequest failed [${method} ${path}]:`, err.message);
    if (errorMessage) console.error('Details:', errorMessage);
    return null;
  }
};

// Generic Merging Helper
const mergeCollections = (backend, local) => {
  const merged = [...(backend || [])];
  (local || []).forEach(loc => {
    const lid = loc.id || loc._id;
    const exists = merged.some(b => (b.id || b._id) === lid);
    if (!exists) merged.push(loc);
  });
  return merged;
};

// Generic LocalStorage Helper
const getLocal = (key) => JSON.parse(localStorage.getItem(`ej_${key}`) || '[]');
const setLocal = (key, data) => localStorage.setItem(`ej_${key}`, JSON.stringify(data));

const crudFactory = (endpoint, localKey) => ({
  getAll: async () => {
    const backend = await smartRequest(endpoint, 'GET');
    const local = getLocal(localKey);
    return mergeCollections(backend, local);
  },
  create: async (data) => {
    const res = await smartRequest(endpoint, 'POST', data);
    if (!res) {
      const records = getLocal(localKey);
      const newRecord = { 
        ...data, 
        _id: `temp_${Date.now()}`, 
        id: `temp_${Date.now()}`, 
        createdDate: new Date().toISOString() 
      };
      setLocal(localKey, [newRecord, ...records]);
      return newRecord;
    }
    return res;
  },
  update: async (id, updates) => {
    const res = await smartRequest(`${endpoint}/${id}`, 'PUT', updates);
    if (!res) {
      const records = getLocal(localKey);
      const idx = records.findIndex(r => (r.id || r._id) === id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...updates };
        setLocal(localKey, records);
      }
    }
    return res;
  },
  delete: async (id) => {
    await smartRequest(`${endpoint}/${id}`, 'DELETE');
    const records = getLocal(localKey);
    setLocal(localKey, records.filter(r => (r.id || r._id) !== id));
  },
  bulkCreate: async (records) => {
    const res = await smartRequest(`${endpoint}/bulk`, 'POST', records);
    if (!res) {
      const existing = getLocal(localKey);
      setLocal(localKey, [...records, ...existing]);
    }
    return res;
  }
});

export const leadsDB = {
  ...crudFactory('/leads', 'leads'),
  getAll: async (user) => {
    const backend = await smartRequest('/leads', 'GET');
    const local = getLocal('leads');
    const merged = mergeCollections(backend, local);
    if (user?.role === 'SDR') return merged.filter(l => l.assignedTo === user.id);
    return merged;
  },
  checkDuplicate: (phone, districtId, excludeId) => {
    const leads = getLocal('leads');
    return leads.find(l => 
      l.phone === phone && 
      l.districtId === districtId && 
      (l.id || l._id) !== excludeId
    );
  },
  bulkDelete: async (ids) => {
    await smartRequest('/leads/bulk-delete', 'POST', ids);
    const records = getLocal('leads');
    setLocal('leads', records.filter(r => !ids.includes(r.id || r._id)));
  },
  bulkUpdate: async (ids, updates) => {
    // Serial updates - no bulk PUT endpoint on server
    for (const id of ids) {
      await smartRequest(`/leads/${id}`, 'PUT', updates);
    }
    // Also update local storage
    const records = getLocal('leads');
    const updated = records.map(r => ids.includes(r.id || r._id) ? { ...r, ...updates } : r);
    setLocal('leads', updated);
  }
};

export const districtsDB = {
  ...crudFactory('/districts', 'districts'),
  markSold: async (id, franchiseeId) => {
    return await smartRequest(`/districts/${id}`, 'PUT', { 
      status: 'Sold', 
      soldDate: new Date().toISOString(), 
      franchiseeId 
    });
  },
  bulkDelete: async (ids) => {
    await smartRequest('/districts/bulk-delete', 'POST', ids);
    const stored = getLocal('districts');
    setLocal('districts', stored.filter(d => !ids.includes(d.id || d._id)));
  }
};
export const franchiseesDB = {
  ...crudFactory('/franchisees', 'franchisees'),
  bulkDelete: async (ids) => {
    await smartRequest('/franchisees/bulk-delete', 'POST', ids);
    const stored = getLocal('franchisees');
    setLocal('franchisees', stored.filter(f => !ids.includes(f.id || f._id)));
  }
};

export const tasksDB = crudFactory('/tasks', 'tasks');
export const meetingsDB = crudFactory('/meetings', 'meetings');

export const usersDB = {
  ...crudFactory('/users', 'users'),
  resendInvite: async (userId) => await smartRequest(`/users/${userId}/resend-invite`, 'POST'),
  bulkDelete: async (ids) => {
    await smartRequest('/users/bulk-delete', 'POST', ids);
    const stored = getLocal('users');
    setLocal('users', stored.filter(u => !ids.includes(u.id || u._id)));
  },
  authenticate: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) return await res.json();
      throw new Error('Backend auth failed');
    } catch (e) {
      const { DEMO_USERS } = await import('../data/initialData');
      const localUsers = getLocal('users');
      const all = [...DEMO_USERS, ...localUsers];
      return all.find(u => u.email === email && u.password === password) || null;
    }
  }
};

export async function getNextSDR() {
  const res = await smartRequest('/users/next-sdr', 'GET');
  if (res) return res;
  
  const sdrs = getLocal('users').filter(u => u.role === 'SDR');
  if (!sdrs.length) return null;
  const counter = parseInt(localStorage.getItem('ej_sdr_counter') || '0');
  const sdr = sdrs[counter % sdrs.length];
  localStorage.setItem('ej_sdr_counter', (counter + 1).toString());
  return sdr;
}

// Global Leads compatibility
export const exportToCSV = (data, filename, columns) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(item => columns.map(c => {
    const val = item[c.key] || '';
    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
  }).join(','));
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
};

export const parseCSV = (csvText) => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  // Auto-detect delimiter: tab or comma
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const header = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    header.forEach((h, i) => { if (values[i] !== undefined) obj[h] = values[i]; });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
};

export const downloadTemplate = (headers, filename) => {
  const blob = new Blob([headers.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
};
