import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  Users, TrendingUp, MapPin, Building2, CheckSquare,
  Clock, AlertTriangle, ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { STAGES } from '../data/initialData';

const STAGE_COLORS = {
  'New Lead': '#516F90', 
  'Contacted': '#2D3E50', 
  'Interested': 'var(--brand-primary)',
  'Webinar Registered': '#7C98B6', 
  'Webinar Attended': '#000000',
  '1:1 Scheduled': 'var(--brand-primary)', 
  'Qualified': '#10B981', 
  'Negotiation': '#F97316',
  'Closed Won': '#22C55E', 
  'Closed Lost': '#EF4444',
};

const SOURCE_COLORS = ['#FF6B00', '#000000', '#516F90', '#CBD6E2', '#2D3E50', '#7C98B6'];

function AdminDashboard({ leads, districts, franchisees, tasks, users }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const leadsToday = leads.filter(l => new Date(l.createdDate) >= today).length;
  const leadsWeek = leads.filter(l => new Date(l.createdDate) >= weekAgo).length;
  const leadsMonth = leads.filter(l => new Date(l.createdDate) >= monthAgo).length;
  const closedWon = leads.filter(l => l.stage === 'Closed Won').length;
  const convRate = leads.length ? ((closedWon / leads.length) * 100).toFixed(1) : 0;
  const pipelineValue = franchisees.reduce((s, f) => s + (f.committedAmount || 0), 0);
  const pendingTasks = tasks.filter(t => !t.done).length;

  const kpis = [
    { label: 'Leads Today', value: leadsToday, icon: Users, accent: 'var(--brand-primary)', change: `+${leadsWeek} this week` },
    { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp, accent: '#000000', change: `${closedWon} deals closed` },
    { label: 'Pipeline Val', value: `₹${(pipelineValue / 100000).toFixed(1)}L`, icon: Building2, accent: 'var(--brand-primary)', change: `${franchisees.length} active units` },
    { label: 'Pending Tasks', value: pendingTasks, icon: CheckSquare, accent: '#516F90', change: `${tasks.filter(t => !t.done && new Date(t.dueDate) < new Date()).length} overdue` },
  ];

  // Charts data
  const bySource = Object.entries(
    leads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byStage = STAGES.map(s => ({ name: s, count: leads.filter(l => l.stage === s).length }));
  const byDistrict = Object.entries(
    leads.reduce((acc, l) => {
      const d = districts.find(d => d.id === l.districtId);
      const name = d?.name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1; return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

  const recentLeads = [...leads].sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate)).slice(0, 6);

  return (
    <div className="animate-in">
      {/* KPI Cards */}
      <div className="kpi-grid mb-8">
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="kpi-card-label">{k.label}</span>
              <k.icon size={16} color="var(--brand-primary)" />
            </div>
            <div className="kpi-card-value">{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{k.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Stage Funnel */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#33475b' }}>Pipeline Velocity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {byStage.filter(s => s.count > 0).map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: '#516f90', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{s.count}</span>
                </div>
                <div style={{ height: 6, background: '#f5f8fa', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(s.count / (leads.length || 1)) * 100}%`, 
                    background: STAGE_COLORS[s.name] || 'var(--brand-primary)', 
                    borderRadius: 3 
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#33475b' }}>Lead Sources</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={bySource} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                {bySource.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Updates */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#33475b' }}>Recent Activity</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>View All</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {recentLeads.map(lead => (
              <div key={lead.id} style={{ padding: '12px', background: '#fcfcfc', border: '1px solid #f0f3f6', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[lead.stage] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#33475b' }}>{lead.firstName} {lead.lastName}</div>
                  <div style={{ fontSize: 12, color: '#516f90' }}>{lead.stage} • {new Date(lead.updatedDate).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SDRDashboard({ leads, tasks, currentUser }) {
  const myLeads = leads.filter(l => l.assignedTo === currentUser.id);
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
  const now = new Date();
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const overdue = myTasks.filter(t => !t.done && new Date(t.dueDate) < now);
  const dueToday = myTasks.filter(t => !t.done && new Date(t.dueDate) >= now && new Date(t.dueDate) <= todayEnd);
  const upcoming = myTasks.filter(t => !t.done && new Date(t.dueDate) > todayEnd);

  return (
    <div>
      <div className="kpi-grid kpi-grid-3 mb-4">
        <div className="kpi-card" style={{ '--accent-color': '#ef4444' }}>
          <div className="kpi-card-icon"><AlertTriangle size={20} /></div>
          <div className="kpi-card-value">{overdue.length}</div>
          <div className="kpi-card-label">Overdue Tasks</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': '#f59e0b' }}>
          <div className="kpi-card-icon"><Clock size={20} /></div>
          <div className="kpi-card-value">{dueToday.length}</div>
          <div className="kpi-card-label">Due Today</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': '#6366f1' }}>
          <div className="kpi-card-icon"><Users size={20} /></div>
          <div className="kpi-card-value">{myLeads.length}</div>
          <div className="kpi-card-label">My Active Leads</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tasks */}
        <div className="card">
          <div className="card-header"><h3>My Tasks</h3></div>
          {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>All clear! No pending tasks.</p>
          )}
          {[...overdue.map(t => ({ ...t, _group: 'overdue' })), ...dueToday.map(t => ({ ...t, _group: 'today' })), ...upcoming.slice(0, 3).map(t => ({ ...t, _group: 'upcoming' }))].map(t => (
            <div key={t.id} className="task-item" style={{ marginBottom: 8 }}>
              <div>
                <div className="task-text">{t.title}</div>
                <div className="task-meta">
                  <span className={`badge badge-${t._group}`}>{t._group}</span>
                  <span style={{ marginLeft: 6 }}>Due: {new Date(t.dueDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* My Leads */}
        <div className="card">
          <div className="card-header"><h3>My Leads</h3></div>
          {myLeads.slice(0, 8).map(l => (
            <div key={l.id} className="activity-item">
              <div className="activity-dot" style={{ background: STAGE_COLORS[l.stage] }} />
              <div className="activity-content">
                <div className="activity-text">{l.firstName} {l.lastName}</div>
                <div className="activity-time">
                  <span className={`badge badge-${l.stage.toLowerCase().replace(/[\s:]+/g, '-')}`}>{l.stage}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { leads, districts, franchisees, tasks, meetings, users } = useApp();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('Overview');

  const showAdminView = currentUser?.role === 'Admin' || currentUser?.role === 'Closer';
  const tabs = showAdminView ? ['Overview', 'Franchise Tool'] : ['My Tasks', 'My Leads', 'Franchise Tool'];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#33475b', marginBottom: 4 }}>Welcome back, {currentUser?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && showAdminView && (
        <AdminDashboard leads={leads} districts={districts} franchisees={franchisees} tasks={tasks} users={users} />
      )}
      {tab === 'My Tasks' && !showAdminView && (
        <SDRDashboard leads={leads} tasks={tasks} currentUser={currentUser} />
      )}
      {tab === 'My Leads' && !showAdminView && (
        <SDRDashboard leads={leads} tasks={tasks} currentUser={currentUser} />
      )}
      {tab === 'Franchise Tool' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <a href="https://earlyjobs-franchise-tool.vercel.app/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 5 }}>
              <ExternalLink size={13} /> Open in new tab
            </a>
          </div>
          <iframe
            src="https://earlyjobs-franchise-tool.vercel.app/"
            className="iframe-container"
            title="EarlyJobs Franchise Tool"
            allow="fullscreen"
          />
        </div>
      )}
      {/* Quick Guide */}
      <div className="card" style={{ marginTop: 40, background: 'var(--brand-primary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>🚀 Quick Start Guide</h3>
        <p style={{ opacity: 0.9, fontSize: 14, maxWidth: 600, marginBottom: 24 }}>Welcome to the EarlyJobs Hubspot Premium CRM. Here is how to get started:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>1. Manage Leads</div>
            <p style={{ fontSize: 13, opacity: 0.8 }}>Track potential franchisees from 'New Lead' to 'Closed Won'. Use the "Add Lead" button to start a new deal.</p>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>2. Assign Roles</div>
            <p style={{ fontSize: 13, opacity: 0.8 }}>Admins can go to 'Manage Team' to invite SDRs and Closers. Each role has specific permissions for data safety.</p>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>3. Export Analytics</div>
            <p style={{ fontSize: 13, opacity: 0.8 }}>Visit the 'Reports' section to see your team's performance and export data for your weekly meetings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
