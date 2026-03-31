import React from 'react';
import { ExternalLink, Wrench } from 'lucide-react';

export default function FranchiseTool() {
  return (
    <div className="animate-fade-in flex-col gap-4" style={{ height: '100%', display: 'flex' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Franchise Tool</div>
          <div className="page-subtitle">Access external earlyjobs franchise analysis tools</div>
        </div>
        <div className="page-header-actions">
          <a 
            href="https://earlyjobs-franchise-tool.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} /> Open in New Tab
          </a>
        </div>
      </div>
      
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 600 }}>
        <iframe 
          src="https://earlyjobs-franchise-tool.vercel.app/" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Franchise Assessment Tool"
        />
      </div>
    </div>
  );
}
