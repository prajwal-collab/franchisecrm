import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, Download, Plus, 
  MapPin, Phone, Mail, ChevronUp, ChevronDown,
  Upload, X, CheckCircle2, ChevronRight, AlertCircle,
  FileText, TrendingUp, CheckSquare, Square
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { parseCSV, downloadTemplate } from '../../services/db';
import TableToolbar from '../../components/TableToolbar';

const PAYMENT_BADGE = {
  'Partial': 'badge-warning',
  'Paid Full': 'badge-success',
};

export default function FranchiseeList() {
  const navigate = useNavigate();
  const { franchisees, districts, importFranchisees, createFranchisee } = useApp();
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

  const [showAdd, setShowAdd] = useState(false);
  const [newFranchisee, setNewFranchisee] = useState({
    name: '', contactPerson: '', phone: '', districtId: '', 
    committedAmount: 0, receivedAmount: 0, onboardingDate: new Date().toISOString().split('T')[0]
  });

  const enriched = useMemo(() => franchisees.map(f => ({
    ...f,
    districtName: districts.find(d => (d.id || d._id) === f.districtId)?.name || '—'
  })), [franchisees, districts]);

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
          else if (lcol.includes('person') || lcol.includes('contact')) mapping[col] = 'contactPerson';
          else if (lcol.includes('phone')) mapping[col] = 'phone';
          else if (lcol.includes('district')) mapping[col] = 'districtId';
          else if (lcol.includes('committed')) mapping[col] = 'committedAmount';
          else if (lcol.includes('received')) mapping[col] = 'receivedAmount';
        });
      }
      setImportMapping(mapping);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    const finalized = importData.map(row => {
      const obj = {};
      Object.entries(importMapping).forEach(([fileCol, dbCol]) => {
        if (dbCol) {
          let val = row[fileCol];
          if (dbCol.includes('Amount')) val = parseFloat(val || 0);
          obj[dbCol] = val;
        }
      });
      return { 
        ...obj, 
        onboardingDate: new Date().toISOString(),
        paymentStatus: (obj.receivedAmount >= obj.committedAmount) ? 'Paid Full' : 'Partial'
      };
    });
    await importFranchisees(finalized);
    setShowImport(false);
    setImportStep(1);
    setImportData(null);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#33475b', margin: 0 }}>Franchise Partners</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage active franchise owners and monitor their financial commitment</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 12 }}>
          {can('import') && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                <Upload size={16} /> Import Legacy Data
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> New Partner
          </button>
        </div>
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
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {label}
                    {sortKey === key && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
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
                <td style={{ fontWeight: 600, color: '#33475b' }}>₹{f.committedAmount.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>₹{f.receivedAmount.toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, color: (f.committedAmount - f.receivedAmount) > 0 ? '#ef4444' : '#22c55e' }}>
                  ₹{(f.committedAmount - f.receivedAmount).toLocaleString('en-IN')}
                </td>
                <td>
                  <span className={`badge ${PAYMENT_BADGE[f.paymentStatus]}`}>{f.paymentStatus}</span>
                </td>
              </tr>
            )})}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No partners found matching your search.
                </td>
              </tr>
            )}
          </tbody>
          </table>
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
                          <option value="contactPerson">Contact Person</option>
                          <option value="phone">Phone Number</option>
                          <option value="districtId">District ID</option>
                          <option value="committedAmount">Committed (₹)</option>
                          <option value="receivedAmount">Received (₹)</option>
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

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 600 }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#33475b' }}>Add New Franchise Partner</h2>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ padding: 4, minWidth: 'auto', border: 'none' }}><X size={20} /></button>
            </div>
            <form style={{ padding: '32px' }} onSubmit={async (e) => {
              e.preventDefault();
              await createFranchisee(newFranchisee);
              setShowAdd(false);
              setNewFranchisee({ name: '', contactPerson: '', phone: '', districtId: '', committedAmount: 0, receivedAmount: 0, onboardingDate: new Date().toISOString().split('T')[0] });
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="form-label">Franchise Name</label>
                  <input className="form-input" required value={newFranchisee.name} onChange={e => setNewFranchisee({...newFranchisee, name: e.target.value})} placeholder="e.g. EarlyJobs Hyderabad" />
                </div>
                <div>
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" required value={newFranchisee.contactPerson} onChange={e => setNewFranchisee({...newFranchisee, contactPerson: e.target.value})} placeholder="Owner Name" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" required value={newFranchisee.phone} onChange={e => setNewFranchisee({...newFranchisee, phone: e.target.value})} placeholder="91XXXXXXXX" />
                </div>
                <div>
                  <label className="form-label">District Location</label>
                  <select className="form-input" required value={newFranchisee.districtId} onChange={e => setNewFranchisee({...newFranchisee, districtId: e.target.value})}>
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <div>
                  <label className="form-label">Committed (₹)</label>
                  <input type="number" className="form-input" required value={newFranchisee.committedAmount} onChange={e => setNewFranchisee({...newFranchisee, committedAmount: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Received (₹)</label>
                  <input type="number" className="form-input" required value={newFranchisee.receivedAmount} onChange={e => setNewFranchisee({...newFranchisee, receivedAmount: parseFloat(e.target.value)})} />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
              >
                Create Partner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
