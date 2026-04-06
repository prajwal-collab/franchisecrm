import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import LeadForm from '../../pages/Leads/LeadForm';
import { useApp } from '../../context/AppContext';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isGlobalLeadFormOpen, setIsGlobalLeadFormOpen } = useApp();

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="main-content">
        <Topbar />
        <div className="page-body">
          {children}
        </div>
      </div>

      {isGlobalLeadFormOpen && (
        <LeadForm 
          onClose={() => setIsGlobalLeadFormOpen(false)} 
        />
      )}
    </div>
  );
}
