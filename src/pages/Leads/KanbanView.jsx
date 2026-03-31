import React from 'react';
import { STAGES } from '../../data/initialData';

const STAGE_COLORS = {
  'New Lead': '#64748b', 'Contacted': '#3b82f6', 'Interested': '#8b5cf6',
  'Webinar Registered': '#06b6d4', 'Webinar Attended': '#0891b2',
  '1:1 Scheduled': '#f59e0b', 'Qualified': '#10b981', 'Negotiation': '#f97316',
  'Closed Won': '#22c55e', 'Closed Lost': '#ef4444',
};

export default function KanbanView({ leads, districts, onLeadClick }) {
  return (
    <div className="kanban-board">
      {STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        return (
          <div key={stage} className="kanban-column">
            <div className="kanban-column-header" style={{ borderLeft: `3px solid ${STAGE_COLORS[stage]}` }}>
              <span className="kanban-column-title" style={{ color: STAGE_COLORS[stage] }}>{stage}</span>
              <span className="kanban-column-count">{stageLeads.length}</span>
            </div>
            {stageLeads.map(lead => {
              const district = districts.find(d => d.id === lead.districtId);
              return (
                <div key={lead.id} className="kanban-card" onClick={() => onLeadClick(lead.id)}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{lead.firstName} {lead.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{district?.name || '—'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.source}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 28, height: 4, background: 'var(--bg-elevated)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${lead.score}%`, background: lead.score >= 75 ? '#22c55e' : lead.score >= 50 ? '#f59e0b' : '#6366f1', borderRadius: 10 }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lead.score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
