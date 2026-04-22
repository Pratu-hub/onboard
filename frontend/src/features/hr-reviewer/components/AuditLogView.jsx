import React, { useState } from 'react';

const AuditLogView = ({ document, onBack, onSubmit }) => {
  const [reason, setReason] = useState('');

  if (!document) return null;

  return (
    <div className="bg-[#fdf8f6] max-w-3xl mx-auto py-12">
      <div className="mb-8">
        <button onClick={onBack} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-headline font-bold text-xs uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Case Detail
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-2xl">report</span>
          </div>
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Reject Document</h2>
            <p className="text-sm text-on-surface-variant font-medium">Issue a formal rejection for the document provided.</p>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-primary">description</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface uppercase tracking-wider">{document.doc_type?.replace('_', ' ')}</p>
              <p className="text-[11px] text-on-surface-variant">Candidate: {document.user_name}</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded text-[10px] font-bold uppercase tracking-tighter">Current Status: Needs Review</span>
        </div>
        
        <div className="mb-8">
          <label className="block text-xs font-bold text-on-surface uppercase tracking-widest mb-3">Internal Rejection Notes</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-surface-container-low border border-transparent rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:border-outline-variant/30 focus:outline-none min-h-[180px] transition-all"
            placeholder="Please specify why this document is being rejected (e.g., 'Document is expired', 'Signature missing', 'Information mismatch'). These notes will be recorded for audit purposes."
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant/10">
          <button 
            onClick={onBack} 
            className="px-6 py-3 rounded-xl text-on-surface-variant text-xs uppercase tracking-widest font-bold hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(reason)} 
            disabled={!reason.trim()}
            className="bg-gradient-to-br from-error to-[#93000a] text-white px-8 py-3 rounded-xl text-xs uppercase tracking-widest font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <span className="material-symbols-outlined text-primary text-sm">info</span>
        <p className="text-[11px] text-primary/80 font-medium">
          Note: Rejection will trigger an automated notification to the candidate with the provided notes to assist them in re-uploading the correct documentation.
        </p>
      </div>
    </div>
  );
};

export default AuditLogView;
