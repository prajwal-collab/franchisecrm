import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, Download, Plus, Filter,
  MapPin, Phone, Mail, ChevronUp, ChevronDown,
  Upload, X, CheckCircle2, ChevronRight, AlertCircle,
  FileText, TrendingUp, CheckSquare, Square, Edit2, Trash2,
  DollarSign, Wallet, Inbox, Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { parseCSV, downloadTemplate, exportToCSV } from '../../services/db';
import TableToolbar from '../../components/TableToolbar';
import FranchiseeForm from './FranchiseeForm';

const PAYMENT_BADGE = {
  'Partial': 'badge-warning',
  'Paid Full': 'badge-success',
};

export default function FranchiseeList() {
  const navigate = useNavigate();
  const { franchisees, districts, updateFranchisee, importFranchisees, createFranchisee, deleteFranchisee, bulkDeleteFranchisees, toast } = useApp();
  const { can } = useAuth();
  const fileRef = useRef(null);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState([]);

  // Import State
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importData, setImportData] = useState(null);
  const [importMapping, setImportMapping] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [editFranchisee, setEditFranchisee] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [tempNote, setTempNote] = useState('');

  // Handle note edit start
  useEffect(() => {
    if (editingNote) {
      const item = franchisees.find(f => (f.id || f._id) === editingNote);
      setTempNote(item?.notes || '');
    }
  }, [editingNote, franchisees]);

  const handleNoteSave = async (id) => {
    if (editingNote === id) {
      await updateFranchisee(id, { notes: tempNote });
      setEditingNote(null);
    }
  };

  const enriched = useMemo(() => {
    if (!Array.isArray(franchisees)) return [];
    return franchisees.map(f => ({
      ...f,
      districtName: districts.find(d => (d.id || d._id) === f.districtId)?.name || '—'
    }));
  }, [franchisees, districts]);

  const filtered = useMemo(() => {
    let r = enriched;
    if (search) {
      r = r.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || 
                      f.contactPerson?.toLowerCase().includes(search.toLowerCase()));
    }

    r.sort((a, b) => {
      let va = a[sortKey] || '';
      let vb = b[sortKey] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return r;
  }, [enriched, search, sortKey, sortDir]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const records = parseCSV(evt.target.result);
      setImportData(records);
      // Auto-mapping
      const mapping = {};
      if (records.length) {
        Object.keys(records[0]).forEach(col => {
          const lcol = col.toLowerCase();
          if (lcol.includes('name')) mapping[col] = 'name';
          else if (lcol.includes('district')) mapping[col] = 'districtName';
          else if (lcol.includes('onboarding') || lcol.includes('date')) mapping[col] = 'onboardingDate';
          else if (lcol.includes('committed')) mapping[col] = 'committedAmount';
          else if (lcol.includes('received')) mapping[col] = 'receivedAmount';
          else if (lcol.includes('status')) mapping[col] = 'paymentStatus';
          else if (lcol.includes('notes')) mapping[col] = 'notes';
          else if (lcol.includes('person') || lcol.includes('contact')) mapping[col] = 'contactPerson';
          else if (lcol.includes('phone')) mapping[col] = 'phone';
        });
      }
      setImportMapping(mapping);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    const finalized = importData
      .map(row => {
        const obj = {};
        let hasData = false;
        Object.entries(importMapping).forEach(([fileCol, dbCol]) => {
          if (dbCol && row[fileCol] !== undefined && row[fileCol] !== null) {
            let val = String(row[fileCol]).trim();
            if (val && val !== '(blank)') {
              if (dbCol.includes('Amount')) {
                // Remove commas and currency symbols
                val = parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
              }
              if (dbCol === 'onboardingDate') {
                // Handle DD/MM/YY or DD/MM/YYYY
                const parts = val.split(/[\/\-.]/);
                if (parts.length === 3) {
                  let d = parseInt(parts[0]);
                  let m = parseInt(parts[1]) - 1;
                  let y = parseInt(parts[2]);
                  if (y < 100) y += 2000;
                  const date = new Date(y, m, d);
                  if (!isNaN(date)) val = date.toISOString();
                }
              }
              obj[dbCol] = val;
              hasData = true;
            }
          }
        });

        if (!hasData) return null;

        // District Matching
        if (obj.districtName && !obj.districtId) {
          const match = districts.find(d => 
            d.name.toLowerCase().includes(obj.districtName.toLowerCase()) || 
            obj.districtName.toLowerCase().includes(d.name.toLowerCase())
          );
          if (match) obj.districtId = match.id || match._id;
        }

        // Ensure name exists
        if (!obj.name) obj.name = `Partner ${Math.floor(Math.random() * 10000)}`;

        const committed = parseFloat(obj.committedAmount) || 0;
        const received = parseFloat(obj.receivedAmount) || 0;

        return { 
          ...obj,
          committedAmount: committed,
          receivedAmount: received,
          onboardingDate: obj.onboardingDate || new Date().toISOString(),
          paymentStatus: obj.paymentStatus || ((received >= committed && committed > 0) ? 'Paid Full' : 'Partial')
        };
      })
      .filter(Boolean);

    if (!finalized.length) {
      toast('No data found in selected columns. Please check your mapping.', 'error');
      return;
    }
    await importFranchisees(finalized);
    setShowImport(false);
    setImportStep(1);
    setImportData(null);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Franchise Partners</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage your active franchise network and payment tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {can('import') && (
            <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
              <Upload size={16} /> Import Partners
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditFranchisee(null); setShowForm(true); }}>
            <Plus size={18} /> Add Partner
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Partners', val: (franchisees || []).length, icon: <Users size={18} />, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Total Committed', val: '₹' + ((franchisees || []).reduce((sum, f) => sum + (f.committedAmount || 0), 0) / 100000).toFixed(1) + 'L', icon: <DollarSign size={18} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Total Received', val: '₹' + ((franchisees || []).reduce((sum, f) => sum + (f.receivedAmount || 0), 0) / 100000).toFixed(1) + 'L', icon: <Wallet size={18} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Collection %', val: (franchisees || []).reduce((sum, f) => sum + (f.committedAmount || 0), 0) ? Math.round(((franchisees || []).reduce((sum, f) => sum + (f.receivedAmount || 0), 0) / (franchisees || []).reduce((sum, f) => sum + (f.committedAmount || 0), 0)) * 100) + '%' : '0%', icon: <TrendingUp size={18} />, color: '#ec4899', bg: '#fdf2f8' }
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

      <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: '#fcfcfc', border: '1px solid #eaf0f6' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={16} color="#7c98b6" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            className="form-input"
            placeholder="Search partners by name or person..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <TableToolbar 
          selectedCount={selected.length} 
          onView={() => {
            if (selected.length === 1) {
              navigate(`/franchisees/${selected[0]}`);
            }
          }}
          onEdit={() => {
            if (selected.length === 1) {
              const f = franchisees.find(x => (x.id || x._id) === selected[0]);
              setEditFranchisee(f);
              setShowForm(true);
            } else {
              toast('Please select exactly one partner to edit', 'warning');
            }
          }}
          onDuplicate={async () => {
            for (const id of selected) {
              const f = franchisees.find(x => (x.id || x._id) === id);
              if (f) {
                const { id: _, _id, ...copy } = f;
                await createFranchisee({ ...copy, name: `${f.name} (Copy)` });
              }
            }
            setSelected([]);
          }}
          onDelete={async () => {
            if (window.confirm(`Delete ${selected.length} partner(s)?`)) {
              await bulkDeleteFranchisees(selected);
              setSelected([]);
            }
          }}
          onPrint={() => window.print()}
          onExport={() => {
            const dataToExport = selected.length > 0 ? enriched.filter(f => selected.includes(f.id || f._id)) : enriched;
            exportToCSV(dataToExport, `franchise_partners_${Date.now()}.csv`, [
              { key: 'name', label: 'Partner Name' },
              { key: 'contactPerson', label: 'Contact Person' },
              { key: 'phone', label: 'Phone' },
              { key: 'districtName', label: 'District' },
              { key: 'onboardingDate', label: 'Onboarding Date' },
              { key: 'committedAmount', label: 'Committed (INR)' },
              { key: 'receivedAmount', label: 'Received (INR)' },
              { key: 'paymentStatus', label: 'Status' }
            ]);
          }}
        />
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: 48, cursor: 'pointer' }} onClick={() => setSelected(selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map(f => f.id || f._id))}>
                  {selected.length === filtered.length && filtered.length > 0 ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                </th>
                {[['Partner Name', 'name'], ['District', 'districtName'], ['Onboarding', 'onboardingDate'], ['Committed', 'committedAmount'], ['Received', 'receivedAmount'], ['Balance', 'balanceDue'], ['Status', 'paymentStatus']].map(([label, key]) => (
                <th key={key} style={{ cursor: 'pointer' }} onClick={() => {
                  if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                  else { setSortKey(key); setSortDir('asc'); }
                }} className={['committedAmount', 'receivedAmount', 'balanceDue'].includes(key) ? 'text-right' : ''}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: ['committedAmount', 'receivedAmount', 'balanceDue'].includes(key) ? 'flex-end' : 'flex-start' }}>
                    {label}
                    {sortKey === key && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
               <th onClick={() => {
                 if (sortKey === 'notes') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                 else { setSortKey('notes'); setSortDir('asc'); }
               }} style={{ cursor: 'pointer' }}>Notes</th>
               <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const fid = f.id || f._id;
              return (
              <tr key={fid} onClick={() => navigate(`/franchisees/${fid}`)} style={{ cursor: 'pointer' }}>
                <td onClick={(e) => { e.stopPropagation(); setSelected(prev => prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]); }}>
                  {selected.includes(fid) ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#33475b' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: '#7c98b6' }}>{f.contactPerson}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#516f90', fontSize: 13 }}>
                    <MapPin size={12} color="var(--brand-primary)" />
                    {f.districtName}
                  </div>
                </td>
                <td style={{ color: '#7c98b6', fontSize: 13 }}>
                  {new Date(f.onboardingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="text-right" style={{ fontWeight: 600, color: '#33475b' }}>₹{f.committedAmount.toLocaleString('en-IN')}</td>
                <td className="text-right" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>₹{f.receivedAmount.toLocaleString('en-IN')}</td>
                <td className="text-right" style={{ fontWeight: 700, color: (f.committedAmount - f.receivedAmount) > 0 ? '#ef4444' : '#22c55e' }}>
                  ₹{(f.committedAmount - f.receivedAmount).toLocaleString('en-IN')}
                </td>
                <td>
                  <span className={`badge ${PAYMENT_BADGE[f.paymentStatus]}`}>{f.paymentStatus}</span>
                </td>
                <td onClick={e => e.stopPropagation()} onDoubleClick={() => setEditingNote(fid)}>
                  {editingNote === fid ? (
                    <textarea
                      autoFocus
                      className="form-input"
                      style={{ fontSize: 13, minWidth: 200, minHeight: 60, padding: '4px 8px' }}
                      value={tempNote}
                      onChange={e => setTempNote(e.target.value)}
                      onBlur={() => handleNoteSave(fid)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleNoteSave(fid);
                        }
                        if (e.key === 'Escape') setEditingNote(null);
                      }}
                    />
                  ) : (
                    <div style={{ 
                      fontSize: 13, 
                      color: f.notes ? '#33475b' : '#cbd6e2', 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }} title={f.notes || 'Double-click to add note'}>
                      {f.notes || '—'}
                    </div>
                  )}
                 </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {can('edit') && (
                      <button className="btn btn-ghost" style={{ padding: 6, minWidth: 'auto', color: 'var(--brand-primary)' }} onClick={(e) => {
                        e.stopPropagation();
                        setEditFranchisee(f);
                        setShowForm(true);
                      }}>
                        <Edit2 size={16} />
                      </button>
                    )}
                    
                    {can('delete') && (
                      <button className="btn btn-ghost" style={{ padding: 6, minWidth: 'auto', color: '#ef4444' }} onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this partner?')) {
                          await deleteFranchisee(fid);
                        }
                      }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: '#f5f8fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Inbox size={32} color="#cbd6e2" />
              </div>
              <h3 style={{ fontSize: 18, color: '#33475b', fontWeight: 700, margin: '0 0 8px' }}>No partners found</h3>
              <p style={{ color: '#7c98b6', fontSize: 14, maxWidth: 320, margin: '0 auto' }}>We couldn't find any franchise partners matching your current filters or search query.</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }} onClick={() => { setSearch(''); }}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 700 }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#33475b' }}>Import Franchisee Data</h2>
              <button className="btn btn-secondary" onClick={() => setShowImport(false)} style={{ padding: 4, minWidth: 'auto', border: 'none' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '32px' }}>
              {/* Stepper */}
              <div style={{ display: 'flex', gap: 32, marginBottom: 40, justifyContent: 'center' }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: importStep >= s ? 1 : 0.4 }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      background: importStep > s ? '#22c55e' : (importStep === s ? 'var(--brand-primary)' : '#eaf0f6'), 
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 
                    }}>
                      {importStep > s ? <CheckCircle2 size={16} /> : s}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#33475b' }}>{s === 1 ? 'Upload' : s === 2 ? 'Map' : 'Finish'}</span>
                    {s < 3 && <ChevronRight size={16} color="#cbd6e2" />}
                  </div>
                ))}
              </div>

              {importStep === 1 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
                    <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                      <strong>Data Interdependency Warning:</strong> To properly connect Franchise Partners with their respective territories, the <code style={{ background: '#fef3c7', padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>District ID</code> in your CSV must exactly match an existing District ID in the CRM.
                    </div>
                  </div>
                  <div 
                    style={{ border: '2px dashed #cbd6e2', borderRadius: 12, padding: '64px 32px', cursor: 'pointer', background: '#f9fafb' }} 
                    onClick={() => fileRef.current.click()}
                  >
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <Upload size={32} color="var(--brand-primary)" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#33475b', marginBottom: 8 }}>Upload legacy CSV</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 300, margin: '0 auto 24px' }}>Bridge your old data from Hubspot or spreadsheets into the new premium CRM.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                      <button className="btn btn-primary btn-sm">Select CSV File</button>
                      <button 
                        className="btn-text" 
                        style={{ fontSize: 13, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(
                            ['Franchise Name', 'Contact Person', 'Phone', 'District ID', 'Committed', 'Received'],
                            'franchisees_template.csv'
                          );
                        }}
                      >
                        <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Download Template CSV
                      </button>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </div>
                </div>
              )}

              {importStep === 2 && importData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff9f0', border: '1px solid #ffedd5', borderRadius: 8, marginBottom: 24 }}>
                    <AlertCircle size={18} color="#f97316" />
                    <span style={{ fontSize: 13, color: '#9a3412' }}>Verify your data mappings below to ensure financial accuracy.</span>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: 8, display: 'grid', gap: 12 }}>
                    {Object.keys(importData[0]).map(col => (
                      <div key={col} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 24, alignItems: 'center', padding: '12px 16px', border: '1px solid #eaf0f6', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={16} color="#7c98b6" />
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#33475b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col}</span>
                        </div>
                        <select 
                          className="form-input" 
                          style={{ height: 36, fontSize: 13 }}
                          value={importMapping[col] || ''} 
                          onChange={e => setImportMapping(m => ({ ...m, [col]: e.target.value }))}
                        >
                          <option value="">Skip this column</option>
                          <option value="name">Franchise Name</option>
                          <option value="districtName">District Name (Matching)</option>
                          <option value="onboardingDate">Onboarding Date</option>
                          <option value="contactPerson">Contact Person</option>
                          <option value="phone">Phone Number</option>
                          <option value="committedAmount">Committed (₹)</option>
                          <option value="receivedAmount">Received (₹)</option>
                          <option value="paymentStatus">Payment Status</option>
                          <option value="notes">Notes/Remarks</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <TrendingUp size={40} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#33475b', marginBottom: 12 }}>Data Migration Ready</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.6 }}>
                    You are importing <strong>{importData?.length} partners</strong>. All financial records will be linked to their respective districts.
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: '24px 32px', background: '#f5f8fa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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

      {/* Franchisee Form Modal */}
      {showForm && (
        <FranchiseeForm 
          franchisee={editFranchisee} 
          onClose={() => {
            setShowForm(false);
            setEditFranchisee(null);
          }} 
        />
      )}
    </div>
  );
}
