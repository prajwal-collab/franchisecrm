import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck, Search, Filter, UserCheck, 
  ChevronRight, ExternalLink, UserPlus, 
  TrendingUp, TrendingDown, Minus, Share2, Clipboard
} from 'lucide-react';
import { qualificationsDB, leadsDB } from '../../services/db';
import { useApp } from '../../context/AppContext';

export default function QualificationList() {
  const navigate = useNavigate();
  const { toast, leads } = useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // All, FOFO, FOCO

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await qualificationsDB.getAll();
      setData(res || []);
    } catch (err) {
      toast("Failed to load qualifications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleConvert = async (q) => {
    try {
      const newLead = await qualificationsDB.convertToLead(q._id || q.id);
      if (newLead) {
        toast(`Successfully converted ${newLead.firstName} to a lead!`, "success");
        refreshData();
      }
    } catch (err) {
      toast("Conversion failed", "error");
    }
  };

  const getLeadName = (q) => {
    if (q.leadId) {
      const lead = leads.find(l => (l.id || l._id) === q.leadId);
      return lead ? `${lead.firstName} ${lead.lastName}` : "Linked Lead";
    }
    return q.leadData ? `${q.leadData.firstName} ${q.leadData.lastName}` : "Unknown";
  };

  const filteredData = data.filter(q => {
    const name = getLeadName(q).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || q.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Lead Qualifications</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage mindsets and assessment scores</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="glass-card" style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search size={16} opacity={0.4} />
            <input 
              placeholder="Search by name..." 
              className="glass-input" 
              style={{ border: 'none', background: 'transparent', width: 200, padding: '8px 0' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="btn btn-ghost" 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '0 16px' }}
          >
            <option value="All">All Models</option>
            <option value="FOFO">Active (FOFO)</option>
            <option value="FOCO">Passive (FOCO)</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 32, background: 'linear-gradient(135deg, var(--bg-card) 0%, #fff 100%)', border: '1px solid var(--brand-primary-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <Share2 size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Public Qualification Form</h4>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Share this link with new prospects to start the assessment.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ 
              background: 'var(--bg-page)', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
              fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <code>{`${window.location.protocol}//${window.location.host}/qualify`}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/qualify`);
                  toast("Standalone link copied!", "success");
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--brand-primary)', display: 'flex' }}
              >
                <Clipboard size={14} />
              </button>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: 12, minWidth: 100 }}
              onClick={() => window.open('/qualify', '_blank')}
            >
              <ExternalLink size={14} /> Open Form
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lead / Prospect</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: 48, textAlign: 'center' }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No qualification responses found.</td></tr>
            ) : filteredData.map(q => (
              <tr key={q._id || q.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{getLeadName(q)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.leadData?.email || "Linked Response"}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                    background: q.type === 'FOFO' ? 'rgba(255,107,0,0.1)' : 'rgba(0,102,255,0.1)',
                    color: q.type === 'FOFO' ? 'var(--brand-primary)' : '#0066ff'
                  }}>
                    {q.type}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{q.totalScore}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/ 60</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                    color: q.qualificationStatus === 'Strong Fit' ? '#10b981' : (q.qualificationStatus === 'Borderline' ? '#f59e0b' : '#ef4444')
                  }}>
                    {q.qualificationStatus === 'Strong Fit' ? <TrendingUp size={14} /> : (q.qualificationStatus === 'Borderline' ? <Minus size={14} /> : <TrendingDown size={14} />)}
                    {q.qualificationStatus}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {new Date(q.date).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {q.leadId ? (
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => navigate(`/leads/${q.leadId}`)}
                      >
                        <ExternalLink size={14} /> View Lead
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}
                        onClick={() => handleConvert(q)}
                      >
                        <UserPlus size={14} /> Convert to Lead
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, padding: 24, background: 'rgba(255,107,0,0.05)', borderRadius: 16, border: '1px dashed var(--brand-primary)' }}>
        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCheck size={18} color="var(--brand-primary)" />
          Quick Tip: Qualification Strategy
        </h4>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Leads with <strong>Strong Fit</strong> statuses (45+ score) should be prioritized for immediate onboarding calls. 
          Use the "Convert to Lead" button for standalone assessments to automatically assign them to <strong>Prajwal</strong>.
        </p>
      </div>
    </div>
  );
}
