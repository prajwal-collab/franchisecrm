import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Building2, MapPin, Phone, 
  Mail, Wallet, TrendingUp, Calendar, 
  Save, Plus, History, FileText, CheckCircle, Clock, Trash2, Edit2, Layers
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
            <div 
              key={stage.stageId || stageIdx} 
              className={`glass-card swipe-up delay-${(stageIdx % 5) + 1}`} 
              style={{ marginBottom: 40, padding: 32, position: 'relative', overflow: 'visible' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 12, background: 'var(--brand-primary-light)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' 
                }}>
                  <Layers size={20} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{stage.stageName}</h3>
              </div>

              <div className="timeline-root">
                <div className="timeline-line"></div>
                {stage.steps.map((step, stepIdx) => (
                  <div key={step.id || stepIdx} className="timeline-step">
                    <div className={`timeline-node ${step.status === 'Done' ? 'done' : step.status === 'In Progress' ? 'active' : ''}`}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <span style={{ 
                            fontSize: 16, 
                            fontWeight: 700, 
                            color: step.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: step.status === 'Done' ? 'line-through' : 'none',
                            transition: 'all 0.3s'
                          }}>
                            {step.text}
                          </span>
                          {step.status === 'Done' && <CheckCircle size={16} color="#10b981" className="pulse-success" />}
                        </div>
                        
                        <textarea 
                          className="glass-input" 
                          placeholder="Updates or findings..." 
                          style={{ width: '100%', minHeight: 60, fontSize: 13, background: 'rgba(0,0,0,0.02)', border: 'none' }}
                          value={step.notes || ''}
                          onChange={e => handleWorkflowChange(stageIdx, stepIdx, 'notes', e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.02)', padding: 4, borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                          {['Pending', 'In Progress', 'Done'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleWorkflowChange(stageIdx, stepIdx, 'status', status)}
                              style={{
                                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: step.status === status ? (
                                  status === 'Done' ? '#10b981' : status === 'In Progress' ? '#f59e0b' : 'var(--text-muted)'
                                ) : 'transparent',
                                color: step.status === status ? 'white' : 'var(--text-muted)',
                                boxShadow: step.status === status ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              {status === 'Done' ? 'Completed' : status}
                            </button>
                          ))}
                        </div>
                        <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 4px' }}></div>
                        <button onClick={() => handleEditStep(stageIdx, stepIdx)} className="btn btn-ghost" style={{ padding: 6, minWidth: 'auto', color: 'var(--brand-primary)' }} title="Edit Step"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteStep(stageIdx, stepIdx)} className="btn btn-ghost" style={{ padding: 6, minWidth: 'auto', color: '#ef4444' }} title="Delete Step"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  className="btn btn-ghost" 
                  style={{ 
                    marginTop: 16, width: '100%', border: '1px dashed var(--border-color)', 
                    borderRadius: 'var(--radius-md)', fontSize: 13, background: 'transparent' 
                  }}
                  onClick={() => handleAddStep(stageIdx)}
                >
                  <Plus size={14} /> Add Progress Step
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
