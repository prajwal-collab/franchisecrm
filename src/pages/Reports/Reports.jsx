import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Download, Filter, TrendingUp, Users, Building2, MapPin, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToCSV } from '../../services/db';
import { STAGES, SOURCES } from '../../data/initialData';

const COLORS = ['#FF6B00', '#33475b', '#516f90', '#cbd6e2', '#7c98b6', '#eaf0f6'];

export default function Reports() {
  const { leads, districts, franchisees, tasks, users, toast } = useApp();
  const [reportType, setReportType] = useState('pipeline');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filter leads by date range
  const filteredLeads = useMemo(() => {
    let result = [...leads];
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(l => new Date(l.createdDate) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(l => new Date(l.createdDate) <= to);
    }
    return result;
  }, [leads, dateFrom, dateTo]);

  const pipelineData = useMemo(() => {
    return STAGES.map(s => ({
      name: s,
      count: filteredLeads.filter(l => l.stage === s).length
    }));
  }, [filteredLeads]);

  const sourceData = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const performanceData = useMemo(() => {
    const sdrs = users.filter(u => u.role === 'SDR');
    return sdrs.map(sdr => ({
      name: sdr.name,
      leads: filteredLeads.filter(l => l.assignedTo === (sdr.id || sdr._id)).length,
      closed: filteredLeads.filter(l => l.assignedTo === (sdr.id || sdr._id) && l.stage === 'Closed Won').length
    }));
  }, [filteredLeads, users]);

  const districtData = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => {
      const d = districts.find(d => (d.id || d._id) === l.districtId);
      const name = d?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filteredLeads, districts]);

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

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiSummary('');
    try {
      const reportContext = {
        reportType,
        dateRange: { from: dateFrom || 'All time', to: dateTo || 'Present' },
        totalLeads: filteredLeads.length,
        closedWon: filteredLeads.filter(l => l.stage === 'Closed Won').length,
        closedLost: filteredLeads.filter(l => l.stage === 'Closed Lost').length,
        conversionRate: filteredLeads.length ? ((filteredLeads.filter(l => l.stage === 'Closed Won').length / filteredLeads.length) * 100).toFixed(1) : 0,
        topSources: sourceData.slice(0, 5),
        stageBreakdown: pipelineData.filter(s => s.count > 0),
        teamPerformance: performanceData,
        districtInsights: districtData.slice(0, 5),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a concise executive report brief based on this CRM report data. Focus on key metrics, trends, and actionable recommendations. Keep it professional and data-driven.

Report Type: ${reportContext.reportType}
Date Range: ${reportContext.dateRange.from} to ${reportContext.dateRange.to}
Total Leads: ${reportContext.totalLeads}
Closed Won: ${reportContext.closedWon}
Closed Lost: ${reportContext.closedLost}
Conversion Rate: ${reportContext.conversionRate}%
Top Sources: ${JSON.stringify(reportContext.topSources)}
Stage Breakdown: ${JSON.stringify(reportContext.stageBreakdown)}
Team Performance: ${JSON.stringify(reportContext.teamPerformance)}
District Insights: ${JSON.stringify(reportContext.districtInsights)}

Format in Markdown with sections: Summary, Key Metrics, Insights, and Recommendations. Keep it under 300 words.`
          }]
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'AI generation failed');
      }
      
      const data = await res.json();
      setAiSummary(data.reply);
    } catch (err) {
      console.error('AI Report Error:', err);
      toast('Failed to generate AI summary: ' + err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
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
          <button 
            className="btn btn-primary" 
            onClick={handleGenerateAI}
            disabled={aiLoading}
            style={{ gap: 8 }}
          >
            {aiLoading ? <Loader2 size={16} className="spin-animation" /> : <Sparkles size={16} />}
            {aiLoading ? 'Generating...' : 'AI Summary'}
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card" style={{ 
        padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', 
        background: '#fcfcfc', border: '1px solid #eaf0f6', flexWrap: 'wrap' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#516f90', fontWeight: 600, fontSize: 13 }}>
          <Calendar size={16} /> Date Range:
        </div>
        <input 
          type="date" 
          className="form-input" 
          style={{ width: 170, fontSize: 13 }}
          value={dateFrom} 
          onChange={e => setDateFrom(e.target.value)} 
          placeholder="From"
        />
        <span style={{ color: '#cbd6e2', fontWeight: 600 }}>→</span>
        <input 
          type="date" 
          className="form-input" 
          style={{ width: 170, fontSize: 13 }}
          value={dateTo} 
          onChange={e => setDateTo(e.target.value)} 
          placeholder="To"
        />
        {(dateFrom || dateTo) && (
          <button 
            className="btn btn-ghost" 
            style={{ fontSize: 12, padding: '4px 12px', color: '#ef4444' }}
            onClick={clearDateFilters}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          Showing <strong style={{ color: 'var(--brand-primary)' }}>{filteredLeads.length}</strong> of {leads.length} leads
        </div>
      </div>

      {/* AI Summary Card */}
      {aiSummary && (
        <div className="card" style={{ 
          marginBottom: 24, padding: 24, 
          background: 'linear-gradient(135deg, #fffbf5 0%, #fff 100%)', 
          border: '1px solid rgba(255,107,0,0.2)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: 8, 
              background: 'rgba(255,107,0,0.1)', color: 'var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={18} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#33475b', margin: 0 }}>AI Report Brief</h3>
            <button 
              className="btn btn-ghost" 
              style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px' }}
              onClick={() => setAiSummary('')}
            >
              Dismiss
            </button>
          </div>
          <div 
            style={{ fontSize: 14, color: '#33475b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/### (.*)/g, '<h4 style="margin:12px 0 4px;font-size:15px;color:#33475b">$1</h4>').replace(/## (.*)/g, '<h3 style="margin:16px 0 8px;font-size:17px;color:#33475b">$1</h3>').replace(/- /g, '• ').replace(/\n/g, '<br/>') }}
          />
        </div>
      )}

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
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{filteredLeads.length}</div>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</span>
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--brand-primary)', marginTop: 8 }}>
                  {((filteredLeads.filter(l => l.stage === 'Closed Won').length / (filteredLeads.length || 1)) * 100).toFixed(1)}%
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
                          {((s.value / filteredLeads.length) * 100).toFixed(1)}%
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
