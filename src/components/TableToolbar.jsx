import React, { useState } from 'react';
import { Copy, Edit2, Trash2, Printer, Download, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TableToolbar({ selectedCount = 0, onEdit, onDuplicate, onDelete, onPrint, onExport, children }) {
  const { toast } = useApp();
  const [showPrint, setShowPrint] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // If no specific handler provided, show a default toast
  const handleFeature = (handler, name) => {
    if (handler) {
      handler();
    } else {
      toast(`${name} feature coming soon!`);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '12px 24px', background: 'white', 
      borderTop: '1px solid var(--border-color)',
      borderBottom: '1px solid var(--border-color)',
      opacity: selectedCount > 0 ? 1 : 0.6,
      pointerEvents: selectedCount > 0 ? 'auto' : 'none',
      transition: 'all 0.2s'
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginRight: 8 }}>
        {selectedCount} selected
      </span>
      
      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleFeature(onEdit, 'Edit')}>
        <Edit2 size={14} /> Edit
      </button>
      
      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleFeature(onDuplicate, 'Duplicate')}>
        <Copy size={14} /> Duplicate
      </button>
      
      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13, color: '#ef4444' }} onClick={() => handleFeature(onDelete, 'Delete')}>
        <Trash2 size={14} /> Delete
      </button>

      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleFeature(onPrint, 'Print')}>
        <Printer size={14} /> Print
      </button>

      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleFeature(onExport, 'Export')}>
        <Download size={14} /> Export
      </button>
      
      {children && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}
