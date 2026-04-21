import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, onSave, saveLabel = 'Save Changes', showSave = true }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {(showSave || onClose) && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            {showSave && onSave && (
              <button className="btn btn-primary" onClick={onSave}>{saveLabel}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
