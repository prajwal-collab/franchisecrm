import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Download, Filter, TrendingUp, Users, Building2, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToCSV } from '../../services/db';
import { STAGES, SOURCES } from '../../data/initialData';

const COLORS = ['#FF6B00', '#33475b', '#516f90', '#cbd6e2', '#7c98b6', '#eaf0f6'];

export default function Reports() {
  const { leads, districts, franchisees, tasks, users } = useApp();
  const [reportType, setReportType] = useState('pipeline');

  const pipelineData = useMemo(() => {
    return STAGES.map(s => ({
      name: s,
      count: leads.filter(l => l.stage === s).length
    }));
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const performanceData = useMemo(() => {
    const sdrs = users.filter(u => u.role === 'SDR');
    return sdrs.map(sdr => ({
      name: sdr.name,
      leads: leads.filter(l => l.assignedTo === sdr.id).length,
      closed: leads.filter(l => l.assignedTo === sdr.id && l.stage === 'Closed Won').length
    }));
  }, [leads, users]);

  const districtData = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      const d = districts.find(d => d.id === l.districtId);
      const name = d?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [leads, districts]);

  const handleExport = () => {
    let data = [];
    let cols = [];
    let filename = '';

    if (reportType === 'pipeline') {
      data = pipelineData;
      cols = [{ key: 'name', label: 'Stage' }, { key: 'count', label: 'Leads' }];
      filename = 'pipeline_report.csv';
    } else if (reportType === 'performance') {
      data = performanceData;
      cols = [{ key: 'name', label: 'SDR' }, { key: 'leads', label: 'Total Leads' }, { key: 'closed', label: 'Closed Won' }];
      filename = 'sdr_performance.csv';
    }

    exportToCSV(data, filename, cols);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track your business performance and pipeline health with real-time data.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border-color)', paddingBottom: 2 }}>
        {[
          { id: 'pipeline', label: 'Pipeline Funnel' },
          { id: 'sources', label: 'Lead Sources' },
          { id: 'districts', label: 'By District' },
          { id: 'performance', label: 'Team Performance' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: reportType === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: reportType === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {reportType === 'pipeline' && (
          <>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Leads by Stage</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600, fill: '#516f90' }} width={140} />
                  <Tooltip cursor={{ fill: '#f5f8fa' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                  <Bar dataKey="count" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gap: 24 }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Leads</span>
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{leads.length}</div>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</span>
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--brand-primary)', marginTop: 8 }}>
                  {((leads.filter(l => l.stage === 'Closed Won').length / (leads.length || 1)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </>
        )}

        {reportType === 'sources' && (
          <>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Acquisition Channels</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={sourceData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {sourceData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th style={{ textAlign: 'right' }}>Count</th>
                      <th style={{ textAlign: 'right' }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceData.map((s, i) => (
                      <tr key={s.name}>
                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                        <td style={{ textAlign: 'right' }}>{s.value}</td>
                        <td style={{ textAlign: 'right', color: 'var(--brand-primary)', fontWeight: 700 }}>
                          {((s.value / leads.length) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {reportType === 'performance' && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>SDR Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#516f90' }} />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#516f90' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="leads" name="Active Leads" fill="#000000" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="closed" name="Closed Won" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportType === 'districts' && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Lead Density by District</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#516f90' }} />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#516f90' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="count" name="Leads" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
