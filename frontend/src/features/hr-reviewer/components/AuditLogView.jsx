import React, { useState } from 'react';

const AuditLogView = ({ document, onBack, onSubmitReject }) => {
  const [reason, setReason] = useState('');

  if (!document) return null;

  return (
    <div className="bg-[#fdf8f6]">
      <div className="bg-[#fdf8f6]/80 backdrop-blur-[20px] sticky top-0 py-4 mb-6 z-10 border-b border-[#c0c7d4]/15">
        <button onClick={onBack} className="text-[#1c1b1b]/70 hover:text-[#1c1b1b] text-sm flex items-center gap-2">
          ← Cancel Rejection
        </button>
      </div>

      <div className="bg-[#ffffff] rounded-[0.75rem] p-8 max-w-2xl mx-auto shadow-sm">
        <h2 className="text-2xl font-light text-[#1c1b1b] tracking-tight mb-2">Reject Document</h2>
        <p className="text-[#1c1b1b]/70 mb-8">Please provide a reason for rejecting {document.user_name}'s {document.doc_type.replace('_', ' ')}.</p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1c1b1b] mb-2">Rejection Reason</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#f1edeb] border-none rounded-md p-4 text-[#1c1b1b] focus:ring-1 focus:ring-[#005faa]/40 focus:outline-none min-h-[150px] resize-y"
            placeholder="e.g., Image is too blurry, expired document..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c7d4]/15">
          <button onClick={onBack} className="border border-[#c0c7d4]/30 px-4 py-2 rounded-md text-[#1c1b1b] text-xs uppercase tracking-wider font-medium hover:bg-[#f7f3f1] transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSubmitReject(document.id, reason)} 
            disabled={!reason.trim()}
            className="bg-gradient-to-br from-[#ba1a1a] to-[#93000a] text-white px-4 py-2 rounded-md text-xs uppercase tracking-wider font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
