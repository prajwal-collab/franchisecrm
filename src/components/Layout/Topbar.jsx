import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const ROLE_COLORS = {
  Admin: 'var(--brand-primary)',
  Closer: '#2d3e50',
  SDR: '#516f90',
  Viewer: '#7c98b6',
};

const BREADCRUMB_MAP = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/districts': 'Districts',
  '/franchisees': 'Franchisees',
  '/meetings': 'Webinars & Meetings',
  '/tasks': 'Tasks',
  '/reports': 'Reports',
  '/franchise-tool': 'Franchise Tool',
};

export default function Topbar() {
  const { currentUser } = useAuth();
  const { leads, districts, franchisees, setIsGlobalLeadFormOpen } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumb = BREADCRUMB_MAP[location.pathname] ||
    (location.pathname.startsWith('/leads/') ? 'Lead Detail' :
     location.pathname.startsWith('/franchisees/') ? 'Franchisee Detail' : '');

  const handleSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    const lq = q.toLowerCase();
    const leadResults = leads.filter(l =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(lq) ||
      l.phone.includes(lq) || l.email?.toLowerCase().includes(lq)
    ).slice(0, 4).map(l => ({ type: 'Lead', label: `${l.firstName} ${l.lastName}`, sub: l.phone, path: `/leads/${l.id || l._id}` }));
    const districtResults = districts.filter(d =>
      d.name.toLowerCase().includes(lq)
    ).slice(0, 3).map(d => ({ type: 'District', label: d.name, sub: d.status, path: '/districts' }));
    const frResults = franchisees.filter(f =>
      f.name.toLowerCase().includes(lq) || f.contactPerson?.toLowerCase().includes(lq)
    ).slice(0, 3).map(f => ({ type: 'Franchisee', label: f.name, sub: f.contactPerson, path: `/franchisees/${f.id || f._id}` }));
    const all = [...leadResults, ...districtResults, ...frResults].slice(0, 8);
    setResults(all);
    setShowResults(true);
  };

  return (
    <div className="topbar">
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span className="breadcrumb-item" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
        {breadcrumb && breadcrumb !== 'Dashboard' && (
          <>
            <span className="breadcrumb-sep" style={{ color: 'var(--border-color)' }}>/</span>
            <span className="breadcrumb-item active" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{breadcrumb}</span>
          </>
        )}
      </div>

      {/* Global Search */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 480, margin: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#f5f8fa', border: '1px solid #eaf0f6', borderRadius: 3 }}>
          <Search size={16} color="#7c98b6" />
          <input
            className="search-input"
            placeholder="Search leads, districts, franchisees..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => query && setShowResults(true)}
            style={{ background: 'none', border: 'none', color: '#33475b', outline: 'none', width: '100%', fontSize: 14 }}
          />
        </div>
        {showResults && results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, marginTop: 8,
            background: 'white', border: '1px solid #cbd6e2',
            borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
          }}>
            {results.map((r, i) => (
              <div
                key={i}
                className="search-result-item"
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f5f8fa' }}
                onMouseDown={() => { navigate(r.path); setShowResults(false); setQuery(''); }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-primary)', background: 'var(--brand-primary-light)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>{r.type}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#33475b', fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: '#7c98b6' }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action */}
      <button 
        className="btn btn-primary" 
        onClick={() => setIsGlobalLeadFormOpen(true)}
        style={{ padding: '8px 16px', gap: 8, fontSize: 13, display: 'flex', alignItems: 'center' }}
      >
        <PlusCircle size={16} />
        {!location.pathname.includes('/leads') && <span>Create Lead</span>}
      </button>

      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#33475b', lineHeight: 1.2 }}>{currentUser?.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: ROLE_COLORS[currentUser?.role], textTransform: 'uppercase', letterSpacing: '0.02em' }}>{currentUser?.role}</span>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--brand-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: 'white', border: '2px solid white', boxShadow: '0 0 0 1px #eaf0f6'
        }}>
          {currentUser?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </div>
  );
}
