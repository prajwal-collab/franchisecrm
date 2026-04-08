import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISTRICT_STATUSES } from '../../data/initialData';

export default function DistrictForm({ district, onClose }) {
  const { franchisees, updateDistrict, createDistrict, toast } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    status: 'Available',
    soldDate: '',
    franchiseeId: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (district) {
      setFormData({
        name: district.name || '',
        status: district.status || 'Available',
        soldDate: district.soldDate ? district.soldDate.split('T')[0] : '',
        franchiseeId: district.franchiseeId || '',
        notes: district.notes || '',
      });
    }
  }, [district]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'District name is required';
    if (formData.status === 'Sold' && !formData.franchiseeId) {
      newErrors.franchiseeId = 'Franchisee is required for sold districts';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = { ...formData };
    if (data.status !== 'Sold') {
      data.soldDate = null;
      data.franchiseeId = null;
    } else if (!data.soldDate) {
      data.soldDate = new Date().toISOString();
    }

    if (district) {
      updateDistrict(district.id || district._id, data);
    } else {
      createDistrict(data);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ 
          padding: '20px 32px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {district ? 'Edit' : 'Create'} District
          </h2>
          <button className="btn btn-secondary" style={{ padding: 8, minWidth: 'auto' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">District Name</label>
            <input 
              className="form-input" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Mumbai South" 
            />
            {errors.name && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Status</label>
            <select 
              className="form-input" 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              {DISTRICT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {formData.status === 'Sold' && (
            <>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Franchise Partner</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <select 
                    className="form-input" 
                    value={formData.franchiseeId} 
                    onChange={e => setFormData({...formData, franchiseeId: e.target.value})}
                    style={{ paddingLeft: 40 }}
                  >
                    <option value="">Select Partner</option>
                    {franchisees.map(f => (
                      <option key={f.id || f._id} value={f.id || f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                {errors.franchiseeId && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.franchiseeId}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label">Sold Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input 
                    type="date"
                    className="form-input" 
                    value={formData.soldDate} 
                    onChange={e => setFormData({...formData, soldDate: e.target.value})}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ paddingLeft: 32, paddingRight: 32 }}>
              <Save size={18} /> {district ? 'Update Territory' : 'Create Territory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
