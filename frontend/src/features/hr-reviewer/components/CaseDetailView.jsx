import React from 'react';

const CaseDetailView = ({ document, onBack, onVerify, onRejectInit }) => {
  if (!document) return null;

  return (
    <div className="bg-[#fdf8f6]">
      <div className="bg-[#fdf8f6]/80 backdrop-blur-[20px] sticky top-0 py-4 mb-6 flex justify-between items-center z-10 border-b border-[#c0c7d4]/15">
        <button onClick={onBack} className="text-[#1c1b1b]/70 hover:text-[#1c1b1b] text-sm flex items-center gap-2">
          ← Back to List
        </button>
        <div className="flex gap-3">
          <button onClick={() => onRejectInit(document)} className="border border-[#c0c7d4]/30 px-4 py-2 rounded-md text-[#1c1b1b] text-xs uppercase tracking-wider font-medium hover:bg-[#f7f3f1] transition-colors">
            Reject Document
          </button>
          <button onClick={() => onVerify(document.id)} className="bg-gradient-to-br from-[#005faa] to-[#0078d4] text-white px-4 py-2 rounded-md text-xs uppercase tracking-wider font-medium hover:opacity-90 transition-opacity">
            Verify Document
          </button>
        </div>
      </div>

      <div className="bg-[#ffffff] rounded-[0.75rem] p-8">
        <h2 className="text-2xl font-light text-[#1c1b1b] tracking-tight mb-2">Case Review: {document.user_name}</h2>
        <p className="text-[#1c1b1b]/70 mb-8 capitalize">{document.doc_type.replace('_', ' ')}</p>
        
        <div className="bg-[#f7f3f1] p-6 rounded-md">
          <h3 className="font-medium text-[#1c1b1b] mb-4">AI Analysis Summary</h3>
          <p className="text-sm text-[#1c1b1b]/80 font-mono bg-[#e6e2e0] p-4 rounded-md whitespace-pre-wrap">
            {document.ai_summary || 'No AI summary available for this document.'}
          </p>
        </div>
        
        <div className="mt-8 border border-[#c0c7d4]/15 rounded-md h-[500px] flex items-center justify-center bg-[#f7f3f1] overflow-hidden">
          {document.url ? (
            <iframe 
              src={document.url} 
              className="w-full h-full border-none" 
              title="Document Viewer"
            />
          ) : (
            <span className="text-[#1c1b1b]/50">No document preview available.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailView;
