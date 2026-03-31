import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STAGES, SOURCES, INVESTMENT_CAPACITIES } from '../../data/initialData';
import { leadsDB, getNextSDR } from '../../services/db';

export default function LeadForm({ lead, onClose }) {
  const { districts, createLead, updateLead, toast } = useApp();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    districtId: '', profession: '', investmentCapacity: '<1L',
    source: 'Website', notes: '', stage: 'New Lead',
    assignedTo: '',
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    } else {
      // Auto-assign SDR on new lead
      const nextSdr = getNextSDR();
      setFormData(prev => ({ ...prev, assignedTo: nextSdr?.id || '' }));
    }
  }, [lead]);

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Phone validation: +91XXXXXXXXXX
    const phoneRegex = /^\+91\d{10}$/;
    if (!formData.phone.match(phoneRegex)) {
      newErrors.phone = 'Format: +91XXXXXXXXXX (10 digits)';
    }

    if (!formData.districtId) newErrors.districtId = 'District is required';
    
    // District validation: check if Sold or Blocked
    const district = districts.find(d => d.id === formData.districtId);
    if (!lead && district && (district.status === 'Sold' || district.status === 'Blocked')) {
      newErrors.districtId = `District is already ${district.status.toLowerCase()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+91')) {
      const digits = val.replace(/\D/g, '');
      val = `+91${digits.slice(0, 10)}`;
    }
    setFormData({ ...formData, phone: val });
    
    // Duplicate check
    if (val.length === 13 && formData.districtId) {
      const dupe = leadsDB.checkDuplicate(val, formData.districtId, lead?.id);
      setDuplicateWarning(dupe ? { id: dupe.id, name: `${dupe.firstName} ${dupe.lastName}` } : null);
    }
  };

  const handleDistrictChange = (e) => {
    const dId = e.target.value;
    setFormData({ ...formData, districtId: dId });
    
    // Duplicate check
    if (formData.phone.length === 13 && dId) {
      const dupe = leadsDB.checkDuplicate(formData.phone, dId, lead?.id);
      setDuplicateWarning(dupe ? { id: dupe.id, name: `${dupe.firstName} ${dupe.lastName}` } : null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (lead) {
      updateLead(lead.id, formData, lead.stage);
    } else {
      createLead(formData);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 600, padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ 
          padding: '20px 32px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {lead ? 'Edit' : 'Create'} Lead
          </h2>
          <button className="btn btn-secondary" style={{ padding: 8, minWidth: 'auto' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          {duplicateWarning && (
            <div style={{ 
              background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 8, 
              padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center',
              color: '#9a3412', fontSize: 13
            }}>
              <AlertCircle size={18} />
              <span>
                A lead with this phone exists: <strong>{duplicateWarning.name}</strong>.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                className="form-input" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                placeholder="e.g. John" 
              />
              {errors.firstName && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.firstName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                className="form-input" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                placeholder="e.g. Doe" 
              />
              {errors.lastName && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.lastName}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="form-input" 
                  value={formData.phone} 
                  onChange={handlePhoneChange} 
                  placeholder="+91XXXXXXXXXX" 
                  maxLength={13} 
                />
                <div style={{ position: 'absolute', right: 12, top: 10, cursor: 'help' }} title="Format: +91 followed by 10 digits">
                  <Info size={14} color="var(--text-muted)" />
                </div>
              </div>
              {errors.phone && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                className="form-input" 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="john@example.com" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Target District</label>
              <select 
                className="form-input" 
                value={formData.districtId} 
                onChange={handleDistrictChange}
                style={{ appearance: 'none', background: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E") no-repeat right 0.5rem center/1.5em 1.5em' }}
              >
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id} disabled={!lead && (d.status === 'Sold' || d.status === 'Blocked')}>
                    {d.name} {d.status !== 'Available' ? `(${d.status})` : ''}
                  </option>
                ))}
              </select>
              {errors.districtId && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.districtId}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Profession</label>
              <input 
                className="form-input" 
                value={formData.profession} 
                onChange={e => setFormData({...formData, profession: e.target.value})} 
                placeholder="e.g. Business Owner" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            <div className="form-group">
              <label className="form-label">Pipeline Stage</label>
              <select className="form-input" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <select 
                className="form-input" 
                value={formData.assignedTo} 
                onChange={e => setFormData({...formData, assignedTo: e.target.value})} 
                disabled={currentUser.role === 'SDR'}
              >
                {useApp().users.filter(u => u.role === 'SDR').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ paddingLeft: 32, paddingRight: 32 }}>
              <Save size={18} /> {lead ? 'Update Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
