import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Building2, Video,
  CheckSquare, BarChart3, MessageSquare, FileText,
  ChevronLeft, ChevronRight, ExternalLink, Wrench, LogOut, Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/leads', icon: Users, label: 'Leads' },
  { path: '/districts', icon: MapPin, label: 'Districts' },
  { path: '/franchisees', icon: Building2, label: 'Franchisees' },
  { path: '/meetings', icon: Video, label: 'Webinars / Meetings' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks', badge: true },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/users', icon: Users, label: 'Manage Team', adminOnly: true },
  { path: '/franchise-tool', icon: Wrench, label: 'Franchise Tool' },
  { path: '/ai-settings', icon: Sparkles, label: 'AI Settings', adminOnly: true },
];

const EXTERNAL_LINKS = [
  { href: 'https://whatsapp.earlyjobs.ai/', icon: MessageSquare, label: 'WhatsApp Campaigns' },
  { href: 'https://unify.smsgupshup.com/WhatsApp/Analytics/', icon: FileText, label: 'WhatsApp Templates' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const { tasks } = useApp();

  const pendingTasks = tasks.filter(t => !t.done).length;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: '0 8px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          background: 'var(--brand-primary)', 
          width: 32, height: 32, borderRadius: 4, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 16, fontWeight: 800
        }}>E</div>
        {!collapsed && <span style={{ color: '#33475b', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>EarlyJobs</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {!collapsed && <div className="sidebar-section-label" style={{ 
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', 
          color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 12 
        }}>Main Menu</div>}
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          if (item.adminOnly && currentUser.role !== 'Admin') return null;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="sidebar-item-icon" size={18} />
              <span className="sidebar-item-text">{item.label}</span>
              {item.badge && pendingTasks > 0 && (
                <span className="sidebar-badge">{pendingTasks}</span>
              )}
            </button>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>External</div>
        {EXTERNAL_LINKS.map(link => {
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-item external"
            >
              <Icon className="sidebar-item-icon" size={18} />
              <span className="sidebar-item-text">{link.label}</span>
              <ExternalLink size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
        <button className="sidebar-item" onClick={logout} style={{ color: '#ff4444' }}>
          <LogOut className="sidebar-item-icon" size={18} />
          {!collapsed && <span className="sidebar-item-text">Logout</span>}
        </button>
        <button 
          className="sidebar-item" 
          onClick={onToggle}
          style={{ background: 'var(--bg-surface)', marginTop: 8 }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="sidebar-item-text">Collapse</span>}
        </button>
      </div>
    </div>
  );
}
