import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Building2, MapPin, Phone, 
  Mail, Wallet, TrendingUp, Calendar, 
  Save, Plus, History, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function FranchiseeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { franchisees, districts, updateFranchisee, toast } = useApp();
  const { can } = useAuth();

  const franchisee = franchisees.find(f => f.id === id);
  const district = districts.find(d => d.id === franchisee?.districtId);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [committedAmount, setCommittedAmount] = useState(franchisee?.committedAmount || 0);

  if (!franchisee) return <div className="page-body">Franchisee not found</div>;

  const handleUpdatePayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast('Invalid payment amount', 'error');
      return;
    }

    const newReceived = franchisee.receivedAmount + amount;
    updateFranchisee(franchisee.id, { 
      receivedAmount: newReceived,
      // Status updated automatically in franchiseesDB.update
    });
    setPaymentAmount('');
    toast(`Payment of ₹${amount.toLocaleString()} recorded`, 'success');
  };

  const handleUpdateCommitment = (e) => {
    updateFranchisee(franchisee.id, { committedAmount: parseFloat(committedAmount) });
  };

  const balance = franchisee.committedAmount - franchisee.receivedAmount;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/franchisees')} style={{ paddingLeft: 0, opacity: 0.7 }}>
            <ChevronLeft size={16} /> Back to Partners
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 className="page-title" style={{ fontSize: 32, fontWeight: 800 }}>{franchisee.name}</h1>
            <span className={`badge ${franchisee.paymentStatus === 'Paid Full' ? 'badge-paid-full' : 'badge-partial'}`}>
              {franchisee.paymentStatus}
            </span>
          </div>
          <div className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: 4 }}>Partner since {new Date(franchisee.onboardingDate).toLocaleDateString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        <div className="flex-col gap-6">
          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Franchise Profile</h4>
            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="detail-field">
                <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>OWNER</div>
                <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{franchisee.contactPerson}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>DISTRICT</div>
                <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{district?.name || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>PHONE</div>
                <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{franchisee.phone}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>EMAIL</div>
                <div className="detail-field-value" style={{ fontSize: 15, fontWeight: 600 }}>{franchisee.email}</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Financial Status</h4>
            <div className="kpi-grid mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div className="glass-card" style={{ padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                <div className="detail-field-label" style={{ fontSize: 10, color: 'var(--text-muted)' }}>COMMITTED</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>₹{franchisee.committedAmount.toLocaleString()}</div>
              </div>
              <div className="glass-card" style={{ padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                <div className="detail-field-label" style={{ fontSize: 10, color: 'var(--text-muted)' }}>RECEIVED</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>₹{franchisee.receivedAmount.toLocaleString()}</div>
              </div>
              <div className="glass-card" style={{ padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                <div className="detail-field-label" style={{ fontSize: 10, color: 'var(--text-muted)' }}>BALANCE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: balance > 0 ? '#f59e0b' : '#10b981' }}>
                  ₹{balance.toLocaleString()}
                </div>
              </div>
            </div>

            {can('edit') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <div className="form-label" style={{ marginBottom: 12, fontSize: 12 }}>UPDATE COMMITMENT</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input 
                      className="glass-input" 
                      style={{ flex: 1 }}
                      type="number" 
                      value={committedAmount} 
                      onChange={e => setCommittedAmount(e.target.value)} 
                    />
                    <button className="btn btn-secondary" onClick={handleUpdateCommitment}>Update</button>
                  </div>
                </div>
                <div>
                  <div className="form-label" style={{ marginBottom: 12, fontSize: 12 }}>RECORD PAYMENT</div>
                  <form onSubmit={handleUpdatePayment} style={{ display: 'flex', gap: 12 }}>
                    <input 
                      className="glass-input" 
                      style={{ flex: 1 }}
                      type="number" 
                      placeholder="Amount"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                    />
                    <button className="btn btn-primary" type="submit">Record</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-col gap-6">
          <div className="glass-card" style={{ padding: 24, minHeight: '100%' }}>
            <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Internal Notes</h4>
            <textarea 
              className="glass-input" 
              style={{ minHeight: 300, fontSize: 13, width: '100%', lineHeight: '1.6' }}
              value={franchisee.notes}
              onChange={(e) => updateFranchisee(franchisee.id, { notes: e.target.value })}
              placeholder="Internal notes about this franchise partner..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
