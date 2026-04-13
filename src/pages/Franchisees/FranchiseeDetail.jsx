import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Building2, MapPin, Phone, 
  Mail, Wallet, TrendingUp, Calendar, 
  Save, Plus, History, FileText, CheckCircle, Clock, Trash2, Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_WORKFLOW_TEMPLATE } from '../../data/franchiseWorkflow';

export default function FranchiseeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { franchisees, districts, updateFranchisee, toast } = useApp();
  const { can } = useAuth();

  const franchisee = franchisees.find(f => f.id === id || f._id === id);
  const district = districts.find(d => (d.id || d._id) === franchisee?.districtId);

  const [activeTab, setActiveTab] = useState('Overview');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [committedAmount, setCommittedAmount] = useState(franchisee?.committedAmount || 0);

  useEffect(() => {
    if (franchisee) {
      setCommittedAmount(franchisee.committedAmount || 0);
      
      // Initialize workflow if missing
      if (!franchisee.onboardingWorkflow) {
        updateFranchisee(franchisee.id || franchisee._id, {
          onboardingWorkflow: JSON.parse(JSON.stringify(DEFAULT_WORKFLOW_TEMPLATE))
        });
      }
    }
  }, [franchisee?.committedAmount, franchisee?.onboardingWorkflow]);

  if (!franchisee) return <div className="page-body">Franchisee not found</div>;

  const handleUpdatePayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast('Invalid payment amount', 'error');
      return;
    }

    const newReceived = (franchisee.receivedAmount || 0) + amount;
    const paymentStatus = (newReceived >= (franchisee.committedAmount || 0) && (franchisee.committedAmount || 0) > 0) ? 'Paid Full' : 'Partial';

    updateFranchisee(franchisee.id || franchisee._id, { 
      receivedAmount: newReceived,
      paymentStatus
    });
    setPaymentAmount('');
    toast(`Payment of ₹${amount.toLocaleString('en-IN')} recorded`, 'success');
  };

  const handleUpdateCommitment = (e) => {
    const newCommitted = parseFloat(committedAmount) || 0;
    const paymentStatus = ((franchisee.receivedAmount || 0) >= newCommitted && newCommitted > 0) ? 'Paid Full' : 'Partial';

    updateFranchisee(franchisee.id || franchisee._id, { 
      committedAmount: newCommitted,
      paymentStatus
    });
  };

  const balance = (franchisee.committedAmount || 0) - (franchisee.receivedAmount || 0);
  const workflow = franchisee.onboardingWorkflow || [];

  const handleWorkflowChange = (stageIdx, stepIdx, field, value) => {
    const freshFlow = JSON.parse(JSON.stringify(workflow));
    freshFlow[stageIdx].steps[stepIdx][field] = value;
    updateFranchisee(franchisee.id || franchisee._id, { onboardingWorkflow: freshFlow });
  };

  const handleAddStep = (stageIdx) => {
    const name = prompt('Enter new step description:');
    if (!name) return;
    const freshFlow = JSON.parse(JSON.stringify(workflow));
    freshFlow[stageIdx].steps.push({
      id: `custom-${Date.now()}`,
      text: name,
      status: 'Pending',
      notes: '',
      link: null
    });
    updateFranchisee(franchisee.id || franchisee._id, { onboardingWorkflow: freshFlow });
  };

  const handleDeleteStep = (stageIdx, stepIdx) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    const freshFlow = JSON.parse(JSON.stringify(workflow));
    freshFlow[stageIdx].steps.splice(stepIdx, 1);
    updateFranchisee(franchisee.id || franchisee._id, { onboardingWorkflow: freshFlow });
  };

  const handleEditStep = (stageIdx, stepIdx) => {
    const currentName = workflow[stageIdx].steps[stepIdx].text;
    const newName = prompt('Edit step description:', currentName);
    if (!newName) return;
    const freshFlow = JSON.parse(JSON.stringify(workflow));
    freshFlow[stageIdx].steps[stepIdx].text = newName;
    updateFranchisee(franchisee.id || franchisee._id, { onboardingWorkflow: freshFlow });
  };

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

      <div className="tabs" style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, marginBottom: 32 }}>
        {['Overview', 'Activation Workflow'].map(t => (
          <button 
            key={t} 
            className={`tab-btn ${activeTab === t ? 'active' : ''}`} 
            onClick={() => setActiveTab(t)}
            style={{ 
              background: 'none', border: 'none', color: activeTab === t ? 'var(--brand-primary)' : 'var(--text-muted)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              padding: '4px 0', position: 'relative'
            }}
          >
            {t}
            {activeTab === t && <div style={{ position: 'absolute', bottom: -17, left: 0, right: 0, height: 2, background: 'var(--brand-primary)' }} />}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
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
                  <div style={{ fontSize: 20, fontWeight: 800 }}>₹{(franchisee.committedAmount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="glass-card" style={{ padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="detail-field-label" style={{ fontSize: 10, color: 'var(--text-muted)' }}>RECEIVED</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>₹{(franchisee.receivedAmount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="glass-card" style={{ padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="detail-field-label" style={{ fontSize: 10, color: 'var(--text-muted)' }}>BALANCE</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: balance > 0 ? '#f59e0b' : '#10b981' }}>
                    ₹{balance.toLocaleString('en-IN')}
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
                onChange={(e) => updateFranchisee(franchisee.id || franchisee._id, { notes: e.target.value })}
                placeholder="Internal notes about this franchise partner..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Activation Workflow' && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {workflow.map((stage, stageIdx) => (
            <div key={stage.stageId || stageIdx} className="glass-card" style={{ marginBottom: 24, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--brand-primary)' }}>{stage.stageName}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stage.steps.map((step, stepIdx) => (
                  <div key={step.id || stepIdx} style={{ 
                    padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 12,
                    borderLeft: step.status === 'Done' ? '4px solid #10b981' : step.status === 'In Progress' ? '4px solid #f59e0b' : '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {step.status === 'Done' ? <CheckCircle size={18} color="#10b981" /> : <Clock size={18} color="var(--text-muted)" />}
                        <span style={{ fontSize: 15, fontWeight: 600, color: step.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: step.status === 'Done' ? 'line-through' : 'none' }}>
                          {step.text}
                        </span>
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--brand-primary)', textDecoration: 'underline' }}>Link</a>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <select 
                          className="glass-input" 
                          style={{ padding: '6px 12px', fontSize: 13, minWidth: 130 }}
                          value={step.status} 
                          onChange={e => handleWorkflowChange(stageIdx, stepIdx, 'status', e.target.value)}
                        >
                          <option value="Pending" style={{ background: 'var(--bg-deep)' }}>Pending</option>
                          <option value="In Progress" style={{ background: 'var(--bg-deep)' }}>In Progress</option>
                          <option value="Done" style={{ background: 'var(--bg-deep)' }}>Done</option>
                        </select>
                        <button onClick={() => handleEditStep(stageIdx, stepIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteStep(stageIdx, stepIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <textarea 
                      className="glass-input" 
                      placeholder="Add progress update, findings, or notes..." 
                      style={{ width: '100%', height: 60, fontSize: 13 }}
                      value={step.notes || ''}
                      onChange={e => handleWorkflowChange(stageIdx, stepIdx, 'notes', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <button 
                className="btn btn-ghost" 
                style={{ marginTop: 16, width: '100%', border: '1px dashed var(--glass-border)' }}
                onClick={() => handleAddStep(stageIdx)}
              >
                <Plus size={16} /> Add Custom Step
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
