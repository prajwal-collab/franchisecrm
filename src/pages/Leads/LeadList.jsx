import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Download, Upload, Search, Filter, Trash2,
  Edit2, ChevronUp, ChevronDown, RefreshCw, LayoutGrid,
  List, CheckSquare, Square, AlertTriangle, X, Zap, AlertCircle,
  TrendingUp, Users, Target, PieChart, Inbox
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { districtsDB, exportToCSV, parseCSV, usersDB, downloadTemplate } from '../../services/db';
import { STAGES, SOURCES, INVESTMENT_CAPACITIES } from '../../data/initialData';
import LeadForm from './LeadForm';
import KanbanView from './KanbanView';
import TableToolbar from '../../components/TableToolbar';

const STAGE_BADGE = {
  'New Lead': 'badge-new-lead', 'Contacted': 'badge-contacted', 'Interested': 'badge-interested',
  'Webinar Registered': 'badge-webinar-reg', 'Webinar Attended': 'badge-webinar-att',
  '1:1 Scheduled': 'badge-1-1', 'Qualified': 'badge-qualified', 'Negotiation': 'badge-negotiation',
  'Closed Won': 'badge-closed-won', 'Closed Lost': 'badge-closed-lost',
};

const EXPORT_COLS = [
  { key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' },
  { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
  { key: 'districtName', label: 'District' }, { key: 'profession', label: 'Profession' },
  { key: 'investmentCapacity', label: 'Investment Capacity' }, { key: 'source', label: 'Source' },
  { key: 'stage', label: 'Stage' }, { key: 'score', label: 'Score' },
  { key: 'assignedToName', label: 'Assigned To' }, { key: 'createdDate', label: 'Created Date' },
];

export default function LeadList() {
  const { leads, districts, users, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, importLeads, refresh, toast } = useApp();
  const { can } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [view, setView] = useState('list'); // list | kanban
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [sortKey, setSortKey] = useState('updatedDate');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importMapping, setImportMapping] = useState({});
  const [importStep, setImportStep] = useState(1); // 1=upload 2=map 3=confirm
  const [bulkStage, setBulkStage] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [tempNote, setTempNote] = useState('');

  // Handle note edit start
  useEffect(() => {
    if (editingNote) {
      const item = leads.find(l => (l.id || l._id) === editingNote);
      setTempNote(item?.notes || '');
    }
  }, [editingNote, leads]);

  const handleNoteSave = async (id, type) => {
    if (editingNote === id) {
      if (type === 'lead') await updateLead(id, { notes: tempNote });
      setEditingNote(null);
    }
  };

  // Enrich leads
  const enriched = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    return leads.map(l => ({
      ...l,
      districtName: districts.find(d => (d.id || d._id) === l.districtId)?.name || '—',
      assignedToName: users.find(u => (u.id || u._id) === l.assignedTo)?.name || '—',
    }));
  }, [leads, districts, users]);

  // Filter + sort
  const filtered = useMemo(() => {
    let r = enriched;
    if (search) {
      const lq = search.toLowerCase();
      r = r.filter(l => `${l.firstName} ${l.lastName}`.toLowerCase().includes(lq) ||
        l.phone.includes(lq) || (l.email || '').toLowerCase().includes(lq) ||
        l.districtName.toLowerCase().includes(lq));
    }
    if (filterStage) r = r.filter(l => l.stage === filterStage);
    if (filterSource) r = r.filter(l => l.source === filterSource);
    if (filterDistrict) r = r.filter(l => l.districtId === filterDistrict);
    r = [...r].sort((a, b) => {
      let va = a[sortKey] || ''; let vb = b[sortKey] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return r;
  }, [enriched, search, filterStage, filterSource, filterDistrict, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id) => {
    if (!id) return;
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const toggleAll = () => {
    const allIds = filtered.map(l => l.id || l._id).filter(Boolean);
    const areAllInFilteredSelected = allIds.every(id => selected.includes(id));
    
    if (areAllInFilteredSelected && allIds.length > 0) {
      // Unselect only those in the current filtered view
      setSelected(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      // Select all in current filtered view
      setSelected(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  // ---- Export ----
  const handleExport = () => {
    const data = (selected.length ? filtered.filter(l => selected.includes(l.id || l._id)) : filtered)
      .map(l => ({ ...l, createdDate: new Date(l.createdDate).toLocaleDateString('en-IN') }));
    exportToCSV(data, `leads_export_${Date.now()}.csv`, EXPORT_COLS);
  };

  // ---- Import ----
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      if (!rows.length) { toast('No data found in CSV', 'error'); return; }
      setImportData(rows);
      // Auto-map columns
      const headers = Object.keys(rows[0]);
      const mapping = {};
      const autoMap = { 'first name': 'firstName', 'last name': 'lastName', phone: 'phone', email: 'email', district: 'districtName', profession: 'profession', 'investment capacity': 'investmentCapacity', source: 'source', stage: 'stage' };
      headers.forEach(h => { const key = autoMap[h.toLowerCase()]; if (key) mapping[h] = key; });
      setImportMapping(mapping);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    const sdrs = users.filter(u => u.role === 'SDR');

    const records = importData.map((row, i) => {
      const rec = { id: `imp_${Date.now()}_${i}` };
      Object.entries(importMapping).forEach(([csvCol, field]) => { if (field) rec[field] = row[csvCol]; });
      // Normalize phone
      if (rec.phone) {
        const digits = rec.phone.toString().replace(/\D/g, '');
        if (digits.length === 10) rec.phone = `+91${digits}`;
        else if (digits.length === 12 && digits.startsWith('91')) rec.phone = `+${digits}`;
      }
      // Resolve district
      if (rec.districtName) {
        const d = districts.find(d => d.name.toLowerCase() === rec.districtName.toLowerCase());
        rec.districtId = d?._id || d?.id || null;
      }
      // Default stage
      if (!rec.stage || !STAGES.includes(rec.stage)) rec.stage = 'New Lead';
      // Auto assign SDR
      if (!rec.assignedTo && sdrs.length) {
        rec.assignedTo = sdrs[i % sdrs.length].id || sdrs[i % sdrs.length]._id;
      }
      return rec;
    });
    importLeads(records);
    setShowImport(false);
    setImportData(null);
    setImportStep(1);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Leads Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track and qualify incoming franchise inquiries</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {can('import') && (
            <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
              <Upload size={16} /> Import Leads
            </button>
          )}
          {can('create') && (
            <button className="btn btn-primary" onClick={() => { setEditLead(null); setShowForm(true); }}>
              <Plus size={18} /> Add New Lead
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Leads', val: (leads || []).length, icon: <Users size={18} />, color: '#6366f1', bg: '#eef2ff' },
          { label: 'High Potential', val: (leads || []).filter(l => (l.score || 0) >= 70).length, icon: <Target size={18} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Hot Leads', val: (leads || []).filter(l => l.stage === 'Closed Won').length, icon: <TrendingUp size={18} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Conversion', val: (leads || []).length ? Math.round(((leads || []).filter(l => l.stage === 'Closed Won').length / (leads || []).length) * 100) + '%' : '0%', icon: <PieChart size={18} />, color: '#ec4899', bg: '#fdf2f8' }
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', maxWidth: 300, position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input 
            className="form-input" 
            placeholder="Search leads..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select className="form-input" style={{ width: 160 }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-input" style={{ width: 140 }} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: 8 }} onClick={() => setView('list')}>
            <List size={18} />
          </button>
          <button className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: 8 }} onClick={() => setView('kanban')}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Views */}
      {view === 'kanban' ? (
        <KanbanView leads={filtered} districts={districts} onLeadClick={id => navigate(`/leads/${id}`)} />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TableToolbar 
            selectedCount={selected.length}
            onView={() => {
              if (selected.length === 1) {
                navigate(`/leads/${selected[0]}`);
              }
            }}
            onEdit={() => {
              if (selected.length === 1) {
                const l = leads.find(x => (x.id || x._id) === selected[0]);
                if (l) { setEditLead(l); setShowForm(true); }
              } else {
                toast('Please select exactly one lead to edit', 'warning');
              }
            }}
            onDuplicate={can('create') ? () => {
              selected.forEach(id => {
                const l = leads.find(x => (x.id || x._id) === id);
                if (l) {
                  const { id: _, _id, ...copy } = l;
                  createLead({ ...copy, firstName: `${l.firstName} (Copy)` });
                }
              });
              setSelected([]);
            } : undefined}
            onDelete={can('delete') ? () => { if (window.confirm(`Delete ${selected.length} leads?`)) { bulkDeleteLeads(selected); setSelected([]); } } : undefined}
            onPrint={() => window.print()}
            onExport={handleExport}
          >
            {selected.length > 0 && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <select className="form-input" style={{ width: 140, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={bulkStage} onChange={e => setBulkStage(e.target.value)}>
                  <option value="" style={{ color: 'black' }}>Bulk Stage</option>
                  {STAGES.map(s => <option key={s} value={s} style={{ color: 'black' }}>{s}</option>)}
                </select>
                {bulkStage && (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { bulkUpdateLeads(selected, { stage: bulkStage }); setSelected([]); setBulkStage(''); }}>
                    Apply
                  </button>
                )}

                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

                <select className="form-input" style={{ width: 140, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)}>
                  <option value="" style={{ color: 'black' }}>Bulk Assign</option>
                  {users.filter(u => u.role === 'SDR').map(u => <option key={u.id || u._id} value={u.id || u._id} style={{ color: 'black' }}>{u.name}</option>)}
                </select>
                {bulkAssignee && (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { bulkUpdateLeads(selected, { assignedTo: bulkAssignee }); setSelected([]); setBulkAssignee(''); }}>
                    Apply
                  </button>
                )}
              </div>
            )}
          </TableToolbar>
          <div className="table-responsive">
            <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>
                  <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={toggleAll}>
                    {filtered.length > 0 && filtered.every(l => selected.includes(l.id || l._id)) ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                  </div>
                </th>
                <th onClick={() => toggleSort('firstName')} style={{ cursor: 'pointer' }}>Name</th>
                <th onClick={() => toggleSort('phone')} style={{ cursor: 'pointer' }}>Contact</th>
                <th onClick={() => toggleSort('districtName')} style={{ cursor: 'pointer' }}>District</th>
                <th onClick={() => toggleSort('stage')} style={{ cursor: 'pointer' }}>Stage</th>
                <th onClick={() => toggleSort('score')} style={{ cursor: 'pointer' }}>Score</th>
                <th onClick={() => toggleSort('notes')} style={{ cursor: 'pointer' }}>Notes</th>
                <th onClick={() => toggleSort('updatedDate')} style={{ cursor: 'pointer' }}>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>No leads found Matching your criteria.</td></tr>
              )}
              {filtered.map(lead => {
                const lid = lead._id || lead.id;
                if (!lid) return null; // Safety check
                return (
                  <tr key={lid} style={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${lid}`)}>
                    <td onClick={e => { e.stopPropagation(); toggleSelect(lid); }}>
                      {selected.includes(lid) ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lead?.firstName} {lead?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lead?.source}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 14 }}>{lead?.phone}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lead?.email}</div>
                    </td>
                    <td><span className="badge badge-new" style={{ background: '#f0f9ff', color: '#0369a1' }}>{lead.districtName}</span></td>
                    <td><span className={`badge ${STAGE_BADGE[lead.stage] || ''}`} style={{ fontWeight: 700 }}>{lead.stage}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 64, height: 6, background: '#eaf0f6', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${lead.score}%`, background: lead.score >= 70 ? '#10b981' : lead.score >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{lead.score}</span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()} onDoubleClick={() => setEditingNote(lid)}>
                      {editingNote === lid ? (
                        <textarea
                          autoFocus
                          className="form-input"
                          style={{ fontSize: 13, minWidth: 200, minHeight: 60, padding: '4px 8px' }}
                          value={tempNote}
                          onChange={e => setTempNote(e.target.value)}
                          onBlur={() => handleNoteSave(lid, 'lead')}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleNoteSave(lid, 'lead');
                            }
                            if (e.key === 'Escape') setEditingNote(null);
                          }}
                        />
                      ) : (
                        <div style={{ 
                          fontSize: 13, 
                          color: lead.notes ? '#33475b' : '#cbd6e2', 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }} title={lead.notes || 'Double-click to add note'}>
                          {lead.notes || '—'}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {lead.updatedDate ? new Date(lead.updatedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        {can('edit') && (
                          <button className="btn btn-secondary" style={{ padding: 6, color: 'var(--brand-primary)' }} onClick={() => { setEditLead(lead); setShowForm(true); }}>
                            <Edit2 size={14} />
                          </button>
                        )}
                        {can('delete') && (
                          <button className="btn btn-secondary" style={{ padding: 6, color: '#ef4444' }} onClick={async () => {
                            if (confirm('Delete this lead?')) {
                              await deleteLead(lid);
                            }
                          }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Form Modal */}
      {showForm && (
        <LeadForm
          lead={editLead}
          onClose={() => { setShowForm(false); setEditLead(null); }}
        />
      )}

      {/* Import Modal - Hubspot Style */}
      {showImport && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 800, padding: 0, overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Import leads from CSV</h2>
              <button className="btn btn-secondary" onClick={() => { setShowImport(false); setImportStep(1); }} style={{ padding: 6 }}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '32px' }}>
              {/* Stepper */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: importStep >= s ? 1 : 0.4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: importStep >= s ? 'var(--brand-primary)' : '#eaf0f6', color: importStep >= s ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{s}</div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s === 1 ? 'Upload file' : s === 2 ? 'Map columns' : 'Confirm'}</span>
                    {s < 3 && <div style={{ width: 32, height: 1, background: '#eaf0f6' }} />}
                  </div>
                ))}
              </div>

              {importStep === 1 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
                    <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                      <strong>Data Interdependency Warning:</strong> To properly connect Leads with their respective territories, the <code style={{ background: '#fef3c7', padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>District</code> names in your CSV must exactly match the existing Districts in the CRM.
                    </div>
                  </div>
                  <div style={{ border: '2px dashed #cbd6e2', borderRadius: 8, padding: '48px', cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => fileRef.current.click()}>
                    <Upload size={48} color="#516f90" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 16, marginBottom: 8 }}>Click to upload or drag and drop</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload a .csv file of your leads. Max file size: 10MB.</p>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </div>
                  <button 
                    className="btn-text" 
                    style={{ marginTop: 24, fontSize: 13, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate(
                        ['First Name', 'Last Name', 'Phone', 'Email', 'District', 'Profession', 'Investment Capacity', 'Source', 'Stage'],
                        'leads_template.csv'
                      );
                    }}
                  >
                    <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Download Template CSV
                  </button>
                </div>
              )}

              {importStep === 2 && importData && (
                <div style={{ height: '400px', overflowY: 'auto', paddingRight: 8 }}>
                  <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>Matching the columns from your file to the properties in EarlyJobs CRM.</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {Object.keys(importData[0]).map(col => (
                      <div key={col} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center', padding: '12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{col}</div>
                        <select className="form-input" value={importMapping[col] || ''} onChange={e => setImportMapping(m => ({ ...m, [col]: e.target.value }))}>
                          <option value="">Skip this column</option>
                          <option value="firstName">First Name</option>
                          <option value="lastName">Last Name</option>
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                          <option value="districtName">District</option>
                          <option value="profession">Profession</option>
                          <option value="investmentCapacity">Investment Capacity</option>
                          <option value="source">Source</option>
                          <option value="stage">Stage</option>
                          <option value="notes">Notes</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckSquare size={32} />
                  </div>
                  <h3 style={{ fontSize: 20, marginBottom: 8 }}>Ready to import {importData?.length} leads</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Once confirmed, these leads will be added to your CRM and assigned to your team.</p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '20px 32px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => { if (importStep === 1) setShowImport(false); else setImportStep(s => s - 1); }}>
                {importStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {importStep === 2 && (
                <button className="btn btn-primary" onClick={() => setImportStep(3)}>Next Step</button>
              )}
              {importStep === 3 && (
                <button className="btn btn-primary" onClick={handleImportConfirm}>Confirm & Import</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
