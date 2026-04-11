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
    return franchisees.map(f => {
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
      const district = districts.find(d => (d.id || d._id) === f.districtId);

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
          activationStats.map(stat => (
            <div 
              key={stat.id || stat._id}
              className="glass-card table-row-hover"
              style={{ 
                padding: 24, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderLeft: stat.progress === 100 ? '4px solid #10b981' : stat.progress > 0 ? '4px solid var(--brand-primary)' : '4px solid var(--glass-border)'
              }}
              onClick={() => navigate(`/franchisees/${stat.id || stat._id}`)}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building2 size={18} color="var(--text-muted)" />
                  {stat.name}
                  {stat.progress === 100 && <CheckCircle size={16} color="#10b981" />}
                </h3>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span><strong style={{ color: 'var(--text-primary)' }}>Owner:</strong> {stat.contactPerson || 'N/A'}</span>
                  <span><strong style={{ color: 'var(--text-primary)' }}>District:</strong> {stat.districtName}</span>
                  <span><strong style={{ color: 'var(--text-primary)' }}>Current State:</strong> {stat.currentStageName}</span>
                </div>
              </div>

              <div style={{ width: 300, textAlign: 'right' }}>
                <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: stat.progress === 100 ? '#10b981' : 'var(--brand-primary)' }}>
                  {stat.progress}% Activated
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stat.progress}%`, 
                    background: stat.progress === 100 ? '#10b981' : 'var(--brand-primary)',
                    borderRadius: 4,
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {stat.completedSteps} of {stat.totalSteps} steps completed
                </div>
              </div>

              <div style={{ paddingLeft: 24, color: 'var(--brand-primary)' }}>
                <ChevronRight size={20} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
