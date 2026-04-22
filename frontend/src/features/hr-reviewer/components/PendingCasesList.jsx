import React from 'react';

const PendingCasesList = ({ documents, onCaseSelect }) => {
  if (!documents || documents.length === 0) {
    return <div className="p-8 text-[#1c1b1b]/70 bg-[#ffffff] rounded-[0.75rem]">No documents pending review.</div>;
  }

  return (
    <div className="bg-[#ffffff] rounded-[0.75rem] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f3f1]">
              <th className="py-4 px-6 text-xs font-medium text-[#1c1b1b]/70 uppercase tracking-tight">Candidate</th>
              <th className="py-4 px-6 text-xs font-medium text-[#1c1b1b]/70 uppercase tracking-tight">Document Type</th>
              <th className="py-4 px-6 text-xs font-medium text-[#1c1b1b]/70 uppercase tracking-tight">Status</th>
              <th className="py-4 px-6 text-xs font-medium text-[#1c1b1b]/70 uppercase tracking-tight text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c0c7d4]/15 text-sm">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-[#f7f3f1]/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-medium text-[#1c1b1b]">{doc.user_name}</div>
                  <div className="text-xs text-[#1c1b1b]/70">{doc.user_email}</div>
                </td>
                <td className="py-4 px-6 capitalize text-[#1c1b1b]/70">
                  {doc.doc_type.replace('_', ' ')}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {doc.status === 'verified' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                    {doc.status === 'rejected' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                    {doc.status === 'flagged' && <span className="w-2 h-2 rounded-full bg-[#974700]"></span>}
                    {doc.status === 'uploaded' && <span className="w-2 h-2 rounded-full bg-[#1260a5]"></span>}
                    {(doc.status === 'pending' || doc.status === 'ai_processing') && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                    <span className="capitalize">{doc.status.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <button 
                    onClick={() => onCaseSelect(doc)}
                    className="bg-gradient-to-br from-[#005faa] to-[#0078d4] text-white px-3 py-1.5 rounded-md text-xs tracking-wider uppercase font-medium hover:opacity-90 transition-opacity"
                  >
                    View Case
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingCasesList;
