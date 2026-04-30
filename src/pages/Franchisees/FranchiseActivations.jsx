import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Building2, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_WORKFLOW_TEMPLATE } from '../../data/franchiseWorkflow';

export default function FranchiseActivations() {
  const navigate = useNavigate();
  const { franchisees, districts } = useApp();

  // Compute activation progress for each franchisee
  const activationStats = useMemo(() => {
    return franchisees.filter(f => f.status === 'Active').map(f => {
      const workflow = f.onboardingWorkflow || JSON.parse(JSON.stringify(DEFAULT_WORKFLOW_TEMPLATE));
      let totalSteps = 0;
      let completedSteps = 0;
      let inProgressSteps = 0;
      let currentStageName = "Not Started";

      workflow.forEach(stage => {
        stage.steps.forEach(step => {
          totalSteps++;
          if (step.status === 'Done') completedSteps++;
          if (step.status === 'In Progress') {
            inProgressSteps++;
            if (currentStageName === "Not Started") {
               currentStageName = stage.stageName;
            }
          }
        });
        
        // Fallback for current stage if none in progress but some done
        const stageCompleted = stage.steps.filter(s => s.status === 'Done').length;
        if (currentStageName === "Not Started" && stageCompleted > 0 && stageCompleted < stage.steps.length) {
            currentStageName = stage.stageName;
        }
      });

      if (currentStageName === "Not Started" && completedSteps > 0 && completedSteps === totalSteps) {
          currentStageName = "Fully Activated";
      }

      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      const district = f.districtId ? districts.find(d => String(d._id) === String(f.districtId) || String(d.id) === String(f.districtId)) : null;

      return {
        ...f,
        districtName: district?.name || 'Unknown',
        totalSteps,
        completedSteps,
        inProgressSteps,
        progress,
        currentStageName
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by most progress first
  }, [franchisees, districts]);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Layers color="var(--brand-primary)" /> Franchise Activations
          </h1>
          <div className="page-subtitle">Track the onboarding and activation progress of all franchise partners</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activationStats.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No franchise partners found.
          </div>
        ) : (
          activationStats.map((stat, idx) => (
            <div 
              key={stat.id || stat._id}
              className={`glass-card table-row-hover swipe-up delay-${(idx % 5) + 1}`}
              style={{ 
                padding: '24px 32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderLeft: stat.progress === 100 ? '4px solid #10b981' : stat.progress > 0 ? '4px solid var(--brand-primary)' : '4px solid var(--glass-border)',
                marginBottom: 12
              }}
              onClick={() => navigate(`/franchisees/${stat.id || stat._id}`)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, borderRadius: 8, background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {stat.name}
                      {stat.progress === 100 && <CheckCircle size={16} color="#10b981" style={{ marginLeft: 8 }} />}
                    </h3>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.districtName} Territory</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)', marginLeft: 44 }}>
                  <span><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>MANAGER:</strong> {stat.contactPerson || '—'}</span>
                  <span><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>STAGE:</strong> {stat.currentStageName}</span>
                </div>
              </div>

              <div style={{ width: 340, textAlign: 'right', paddingRight: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stat.completedSteps} / {stat.totalSteps} Milestones
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: stat.progress === 100 ? '#10b981' : 'var(--brand-primary)' }}>
                    {stat.progress}%
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stat.progress}%`, 
                    background: stat.progress === 100 ? '#10b981' : 'var(--brand-primary)',
                    borderRadius: 10,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>
              </div>

              <div style={{ color: 'var(--brand-primary)', opacity: 0.5 }}>
                <ChevronRight size={24} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
