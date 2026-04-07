import React, { useState } from 'react';
import { Copy, Edit2, Trash2, Printer, Download, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TableToolbar({ selectedCount = 0, onEdit, onDuplicate, onDelete, onPrint, onExport, children }) {
  const { toast } = useApp();

  if (selectedCount === 0) return null;

  return (
    <div className="animate-in table-toolbar-container" style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '10px 24px', background: '#111827', 
      borderRadius: '100px', 
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      zIndex: 10000,
      color: 'white',
      maxWidth: 'min(90vw, 800px)',
      width: 'max-content'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ 
          background: 'var(--brand-primary)', color: 'white', 
          width: 22, height: 22, borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: 11, fontWeight: 700 
        }}>
          {selectedCount}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600 }} className="toolbar-main-label">Selected</span>
      </div>
      
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button 
          className="btn-toolbar" 
          disabled={selectedCount > 1 && onEdit}
          onClick={() => {
            if (selectedCount > 1) {
              toast('Edit only available for single selection', 'warning');
            } else if (onEdit) {
              onEdit();
            } else {
              toast('Edit feature coming soon!', 'info');
            }
          }}
          title={selectedCount > 1 ? "Select exactly one item to edit" : "Edit"}
        >
          <Edit2 size={16} /> <span className="toolbar-label">Edit</span>
        </button>
        
        <button className="btn-toolbar" onClick={() => onDuplicate ? onDuplicate() : toast('Duplicate feature coming soon!')}>
          <Copy size={16} /> <span className="toolbar-label">Duplicate</span>
        </button>
        
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <button className="btn-toolbar" onClick={() => onPrint ? onPrint() : toast('Print feature coming soon!')}>
          <Printer size={16} /> <span className="toolbar-label">Print</span>
        </button>

        <button className="btn-toolbar" onClick={() => onExport ? onExport() : toast('Export feature coming soon!')}>
          <Download size={16} /> <span className="toolbar-label">Export CSV</span>
        </button>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <button className="btn-toolbar btn-toolbar-danger" onClick={() => onDelete ? onDelete() : toast('Delete feature coming soon!')}>
          <Trash2 size={16} /> <span className="toolbar-label">Delete</span>
        </button>
      </div>

      {children && (
        <div style={{ marginLeft: 8, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, alignItems: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}
