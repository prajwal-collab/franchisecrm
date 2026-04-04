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

      <div style={{ position: 'relative' }}>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '6px 12px', fontSize: 13 }}
          onClick={() => setShowPrint(!showPrint)}
          onBlur={() => setTimeout(() => setShowPrint(false), 200)}
        >
          <Printer size={14} /> Print <ChevronDown size={14} />
        </button>
        {showPrint && (
          <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'white', border: '1px solid var(--border-color)', borderRadius: 4, boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: 120 }}>
            <div style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }} onClick={() => handleFeature(onPrint, 'Print List')}>Print List</div>
            <div style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }} onClick={() => handleFeature(null, 'Print Details')}>Print Details</div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '6px 12px', fontSize: 13 }}
          onClick={() => setShowExport(!showExport)}
          onBlur={() => setTimeout(() => setShowExport(false), 200)}
        >
          <Download size={14} /> Export <ChevronDown size={14} />
        </button>
        {showExport && (
          <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'white', border: '1px solid var(--border-color)', borderRadius: 4, boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: 120 }}>
            <div style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }} onClick={() => handleFeature(onExport, 'Export CSV')}>As CSV</div>
            <div style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }} onClick={() => handleFeature(null, 'Export Excel')}>As Excel</div>
          </div>
        )}
      </div>
      
      {children && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}
