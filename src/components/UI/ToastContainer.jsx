import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
const COLORS = { success: 'var(--brand-success)', error: 'var(--brand-danger)', warning: 'var(--brand-warning)', info: 'var(--brand-primary-light)' };

export default function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon size={16} color={COLORS[t.type]} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
