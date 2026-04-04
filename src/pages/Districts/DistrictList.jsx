import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, MapPin, Building2, Calendar, 
  ExternalLink, Plus, Filter, ChevronUp, ChevronDown,
  Upload, Download, X, CheckCircle2, ChevronRight, AlertCircle,
  FileText, CheckSquare, Square
} from 'lucide-react';
import TableToolbar from '../../components/TableToolbar';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DISTRICT_STATUSES } from '../../data/initialData';
import { parseCSV, downloadTemplate, exportToCSV } from '../../services/db';

const STATUS_BADGE = {
  'Available': 'badge-success',
  'Sold': 'badge-danger',
  'Blocked': 'badge-warning',
};

export default function DistrictList() {
  const { districts, franchisees, updateDistrict, createDistrict, importDistricts } = useApp();
  const { can } = useAuth();
  const fileRef = useRef(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState([]);

  // Import State
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importData, setImportData] = useState(null);
  const [importMapping, setImportMapping] = useState({});

  const filtered = useMemo(() => {
    let r = districts.map(d => ({
      ...d,
      franchiseeName: franchisees.find(f => (f.id || f._id) === d.franchiseeId)?.name || '—'
    }));
    
    if (search) {
      r = r.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterStatus) {
      r = r.filter(d => d.status === filterStatus);
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
  }, [districts, franchisees, search, filterStatus, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleStatusChange = (id, newStatus) => {
    updateDistrict(id, { status: newStatus });
  };

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
          else if (lcol.includes('status')) mapping[col] = 'status';
          else if (lcol.includes('sold') || lcol.includes('date')) mapping[col] = 'soldDate';
          else if (lcol.includes('franchisee')) mapping[col] = 'franchiseeId';
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
        if (dbCol) obj[dbCol] = row[fileCol];
      });
      return { 
        ...obj, 
        status: obj.status || 'Available'
      };
    });
    await importDistricts(finalized);
    setShowImport(false);
    setImportStep(1);
    setImportData(null);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#33475b', margin: 0 }}>Districts & Territories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage available areas and analyze franchise performance by region</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 12 }}>
          {can('import') && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                <Upload size={16} /> Import Districts
              </button>
              <button className="btn btn-primary" onClick={() => {
                const name = prompt('Enter new district name:');
                if (name) createDistrict({ name, status: 'Available' });
              }}>
                <Plus size={18} /> Add District
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: '#fcfcfc', border: '1px solid #eaf0f6' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={16} color="#7c98b6" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            className="form-input"
            placeholder="Search districts..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Filter size={14} color="#7c98b6" />
          <select 
            className="form-input" 
            style={{ width: 180 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {DISTRICT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <TableToolbar 
          selectedCount={selected.length}
          onEdit={() => toast('Please edit districts directly from the table or admin dashboard.', 'info')}
          onDuplicate={() => {
            selected.forEach(id => {
              const d = districts.find(x => (x.id || x._id) === id);
              if (d) createDistrict({ name: `${d.name} (Copy)`, status: 'Available' });
            });
            setSelected([]);
          }}
          onDelete={() => toast('Deleting districts is restricted. Please mark status as Blocked.', 'error')}
          onPrint={() => window.print()}
          onExport={() => {
            const data = selected.length ? filtered.filter(d => selected.includes(d.id || d._id)) : filtered;
            exportToCSV(data, `districts_${Date.now()}.csv`, [
              { key: 'name', label: 'District Name' },
              { key: 'status', label: 'Status' },
              { key: 'soldDate', label: 'Sold Date' },
              { key: 'franchiseeName', label: 'Franchisee' }
            ]);
          }}
        />
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: 48, cursor: 'pointer' }} onClick={() => setSelected(selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map(d => d.id || d._id))}>
                  {selected.length === filtered.length && filtered.length > 0 ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                </th>
                {[['District Name', 'name'], ['Status', 'status'], ['Sold Date', 'soldDate'], ['Franchisee', 'franchiseeName']].map(([label, key]) => (
                <th key={key} onClick={() => toggleSort(key)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {label}
                    {sortKey === key && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
              {can('Admin') && <th>Management</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(district => {
              const did = district.id || district._id;
              return (
              <tr key={did}>
                <td onClick={(e) => { e.stopPropagation(); setSelected(prev => prev.includes(did) ? prev.filter(x => x !== did) : [...prev, did]); }}>
                  {selected.includes(did) ? <CheckSquare size={16} color="var(--brand-primary)" /> : <Square size={16} />}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f1f7ff', color: '#007bff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#33475b' }}>{district.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${STATUS_BADGE[district.status]}`}>{district.status}</span>
                </td>
                <td style={{ color: '#516f90' }}>
                  {district.soldDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} style={{ opacity: 0.6 }} />
                      {new Date(district.soldDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  ) : <span style={{ opacity: 0.4 }}>—</span>}
                </td>
                <td>
                  {district.franchiseeId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#33475b', fontWeight: 500 }}>
                      <Building2 size={14} color="var(--brand-primary)" />
                      {district.franchiseeName}
                    </div>
                  ) : <span style={{ opacity: 0.4 }}>Unallocated</span>}
                </td>
                {can('Admin') && (
                  <td>
                    <select 
                      className="form-input" 
                      style={{ width: '130px', fontSize: 12, padding: '4px 8px' }}
                      value={district.status}
                      onChange={(e) => handleStatusChange(district.id || district._id, e.target.value)}
                    >
                      {DISTRICT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            )})}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No districts found matching your search.
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
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#33475b' }}>Import Districts</h2>
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
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFileUpload({ target: { files: e.dataTransfer.files } }); }}
                  >
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <Upload size={32} color="var(--brand-primary)" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#33475b', marginBottom: 8 }}>Choose a CSV file</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 300, margin: '0 auto 24px' }}>Upload your territory data to quickly populate your districts list.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                      <button className="btn btn-primary btn-sm">Select File</button>
                      <button 
                        className="btn-text" 
                        style={{ fontSize: 13, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(
                            ['District Name', 'State', 'Status', 'Inquiry Count', 'Price'],
                            'districts_template.csv'
                          );
                        }}
                      >
                        <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Download Template CSV
                      </button>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </div>
                  <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--brand-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => {
                      const header = 'District Name,Status,Sold Date,Franchisee ID';
                      const samples = [
                        'Mumbai South,Sold,2024-01-15,f_001',
                        'Bangalore Central,Available,,',
                        'Delhi West,Blocked,,'
                      ];
                      const blob = new Blob([`${header}\n${samples.join('\n')}`], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'districts_import_template.csv'; a.click();
                    }}>
                    <Download size={14} /> Download sample template
                  </div>
                </div>
              )}

              {importStep === 2 && importData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff9f0', border: '1px solid #ffedd5', borderRadius: 8, marginBottom: 24 }}>
                    <AlertCircle size={18} color="#f97316" />
                    <span style={{ fontSize: 13, color: '#9a3412' }}>We've auto-matched these columns. Please verify before importing.</span>
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
                          <option value="name">District Name</option>
                          <option value="status">Status</option>
                          <option value="soldDate">Sold Date</option>
                          <option value="franchiseeId">Franchisee ID</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#33475b', marginBottom: 12 }}>Ready to finalize</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 350, margin: '0 auto 32px', lineHeight: 1.6 }}>
                    You are about to import <strong>{importData?.length} districts</strong> into the EarlyJobs territory manager.
                  </p>
                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '20px', display: 'inline-block', minWidth: 280, border: '1px solid #eaf0f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Districts</span>
                      <span style={{ fontWeight: 700, color: '#33475b' }}>{importData?.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Target Module</span>
                      <span style={{ fontWeight: 700, color: '#33475b' }}>Territories</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '24px 32px', background: '#f5f8fa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => { if (importStep === 1) setShowImport(false); else setImportStep(s => s - 1); }}>
                {importStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {importStep === 1 && importData && (
                <button className="btn btn-primary" onClick={() => setImportStep(2)}>Next Step</button>
              )}
              {importStep === 2 && (
                <button className="btn btn-primary" onClick={() => setImportStep(3)}>Review Import</button>
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
