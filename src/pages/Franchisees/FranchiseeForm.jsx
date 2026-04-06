import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Phone, MapPin, Calculator } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function FranchiseeForm({ franchisee, onClose }) {
  const { districts, updateFranchisee, createFranchisee, toast } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    districtId: '',
    committedAmount: 0,
    receivedAmount: 0,
    paymentStatus: 'Partial',
    onboardingDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (franchisee) {
      setFormData({
        name: franchisee.name || '',
        contactPerson: franchisee.contactPerson || '',
        phone: franchisee.phone || '',
        districtId: franchisee.districtId || '',
        committedAmount: franchisee.committedAmount || 0,
        receivedAmount: franchisee.receivedAmount || 0,
        paymentStatus: franchisee.paymentStatus || 'Partial',
        onboardingDate: franchisee.onboardingDate ? franchisee.onboardingDate.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [franchisee]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Franchise name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.districtId) newErrors.districtId = 'District is required';
    if (formData.committedAmount <= 0) newErrors.committedAmount = 'Invalid commitment';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (franchisee) {
      updateFranchisee(franchisee.id || franchisee._id, formData);
    } else {
      createFranchisee(formData);
    }
    onClose();
  };

  // Auto-calculate recommendation for status
  const recommendedStatus = formData.receivedAmount >= formData.committedAmount ? 'Paid Full' : 'Partial';

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 650, padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ 
          padding: '20px 32px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {franchisee ? 'Edit' : 'New'} Franchise Partner
          </h2>
          <button className="btn btn-secondary" style={{ padding: 8, minWidth: 'auto' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Franchise Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: 40 }}
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. EarlyJobs Delhi" 
                />
              </div>
              {errors.name && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: 40 }}
                  value={formData.contactPerson} 
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                  placeholder="Owner / Manager Name" 
                />
              </div>
              {errors.contactPerson && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.contactPerson}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: 40 }}
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+91..." 
                />
              </div>
              {errors.phone && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Territory / District</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <select 
                  className="form-input" 
                  style={{ paddingLeft: 40 }}
                  value={formData.districtId} 
                  onChange={e => setFormData({...formData, districtId: e.target.value})}
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {errors.districtId && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.districtId}</div>}
            </div>
          </div>

          <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, marginBottom: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Records</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Committed (₹)</label>
                <input 
                  type="number"
                  className="form-input" 
                  value={formData.committedAmount} 
                  onChange={e => setFormData({...formData, committedAmount: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Received (₹)</label>
                <input 
                  type="number"
                  className="form-input" 
                  value={formData.receivedAmount} 
                  onChange={e => setFormData({...formData, receivedAmount: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Payment Status</label>
                <select 
                  className="form-input" 
                  value={formData.paymentStatus} 
                  onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  <option value="Partial">Partial</option>
                  <option value="Paid Full">Paid Full</option>
                </select>
                {recommendedStatus !== formData.paymentStatus && (
                   <div style={{ color: 'var(--brand-primary)', fontSize: 10, marginTop: 4, fontWeight: 600 }}>
                    Recommended: {recommendedStatus}
                   </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ paddingLeft: 32, paddingRight: 32 }}>
              <Save size={18} /> {franchisee ? 'Update Partner' : 'Save Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
