# HR Reviewer Dashboard Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Redesign the HR Reviewer dashboard to match the Stitch design using a modular architecture with three distinct views (List, Detail, Audit).

**Architecture:** Create a new feature folder (`frontend/src/features/hr-reviewer/`) containing an orchestrator `HrReviewerDashboard.jsx` and three child components (`PendingCasesList`, `CaseDetailView`, `AuditLogView`). Update `frontend/src/App.jsx` (or the router) to point to the new location and remove the old monolithic `pages/HrReviewerDashboard.jsx`.

**Tech Stack:** React, Tailwind CSS

---

### Task 1: Setup Feature Directory & PendingCasesList

**Files:**
- Create: `frontend/src/features/hr-reviewer/components/PendingCasesList.jsx`

**Step 1: Write the component**
Create the UI for the Pending Cases table following the Stitch tokens (no 1px borders, surface-container-lowest, etc.). It should accept `documents` array and an `onCaseSelect` callback.

```jsx
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
                  <span className="capitalize">{doc.status.replace('_', ' ')}</span>
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
```

**Step 2: Commit**

```bash
git add frontend/src/features/hr-reviewer/components/PendingCasesList.jsx
git commit -m "feat: add PendingCasesList component"
```

### Task 2: Create CaseDetailView

**Files:**
- Create: `frontend/src/features/hr-reviewer/components/CaseDetailView.jsx`

**Step 1: Write the component**
Create the detail view UI that shows document details and provides Verify/Reject buttons.

```jsx
import React from 'react';

const CaseDetailView = ({ document, onBack, onVerify, onRejectInit }) => {
  if (!document) return null;

  return (
    <div className="bg-[#fdf8f6]">
      <div className="bg-[#fdf8f6]/80 backdrop-blur-[20px] sticky top-0 py-4 mb-6 flex justify-between items-center z-10">
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
          <p className="text-sm text-[#1c1b1b]/80 font-mono bg-[#e6e2e0] p-4 rounded-md">
            {document.ai_summary || 'No AI summary available for this document.'}
          </p>
        </div>
        
        {/* Placeholder for document viewer */}
        <div className="mt-8 border border-[#c0c7d4]/15 rounded-md h-[400px] flex items-center justify-center bg-[#f7f3f1]">
          <span className="text-[#1c1b1b]/50">Document Viewer Area</span>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailView;
```

**Step 2: Commit**

```bash
git add frontend/src/features/hr-reviewer/components/CaseDetailView.jsx
git commit -m "feat: add CaseDetailView component"
```

### Task 3: Create AuditLogView

**Files:**
- Create: `frontend/src/features/hr-reviewer/components/AuditLogView.jsx`

**Step 1: Write the component**
Create the rejection flow where the user can enter a reason.

```jsx
import React, { useState } from 'react';

const AuditLogView = ({ document, onBack, onSubmitReject }) => {
  const [reason, setReason] = useState('');

  if (!document) return null;

  return (
    <div className="bg-[#fdf8f6]">
      <div className="bg-[#fdf8f6]/80 backdrop-blur-[20px] sticky top-0 py-4 mb-6 z-10">
        <button onClick={onBack} className="text-[#1c1b1b]/70 hover:text-[#1c1b1b] text-sm flex items-center gap-2">
          ← Cancel Rejection
        </button>
      </div>

      <div className="bg-[#ffffff] rounded-[0.75rem] p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-light text-[#1c1b1b] tracking-tight mb-2">Reject Document</h2>
        <p className="text-[#1c1b1b]/70 mb-8">Please provide a reason for rejecting {document.user_name}'s {document.doc_type.replace('_', ' ')}.</p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1c1b1b] mb-2">Rejection Reason</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#f1edeb] border-none rounded-md p-4 text-[#1c1b1b] focus:ring-1 focus:ring-[#005faa]/40 min-h-[150px]"
            placeholder="e.g., Image is too blurry, expired document..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onBack} className="border border-[#c0c7d4]/30 px-4 py-2 rounded-md text-[#1c1b1b] text-xs uppercase tracking-wider font-medium hover:bg-[#f7f3f1] transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSubmitReject(document.id, reason)} 
            disabled={!reason.trim()}
            className="bg-gradient-to-br from-[#ba1a1a] to-[#93000a] text-white px-4 py-2 rounded-md text-xs uppercase tracking-wider font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
```

**Step 2: Commit**

```bash
git add frontend/src/features/hr-reviewer/components/AuditLogView.jsx
git commit -m "feat: add AuditLogView component"
```

### Task 4: Create HrReviewerDashboard Orchestrator

**Files:**
- Create: `frontend/src/features/hr-reviewer/HrReviewerDashboard.jsx`

**Step 1: Write the component**
Assemble the components and manage the API and state flow.

```jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import PendingCasesList from './components/PendingCasesList';
import CaseDetailView from './components/CaseDetailView';
import AuditLogView from './components/AuditLogView';

const HrReviewerDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeView, setActiveView] = useState('LIST'); // 'LIST' | 'DETAIL' | 'AUDIT'
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await api('/documents');
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, metadata = {}) => {
    try {
      await api(`/documents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...metadata }),
      });
      await fetchDocuments();
      setActiveView('LIST');
      setSelectedCase(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-[#1c1b1b]/70 bg-[#fdf8f6] min-h-screen">Loading cases...</div>;
  if (error) return <div className="p-8 text-[#ba1a1a] bg-[#fdf8f6] min-h-screen">Error: {error}</div>;

  return (
    <div className="bg-[#fdf8f6] min-h-screen pb-12 font-sans">
      {activeView === 'LIST' && (
        <div className="mb-10">
          <h1 className="text-[2rem] font-light text-[#1c1b1b] tracking-tight mb-2">Pending Document Reviews</h1>
          <p className="text-[#1c1b1b]/70">
            Review and verify uploaded identity and compliance documents.
          </p>
        </div>
      )}

      {activeView === 'LIST' && (
        <PendingCasesList 
          documents={documents} 
          onCaseSelect={(doc) => {
            setSelectedCase(doc);
            setActiveView('DETAIL');
          }} 
        />
      )}

      {activeView === 'DETAIL' && (
        <CaseDetailView 
          document={selectedCase} 
          onBack={() => {
            setActiveView('LIST');
            setSelectedCase(null);
          }}
          onVerify={(id) => updateStatus(id, 'verified')}
          onRejectInit={() => setActiveView('AUDIT')}
        />
      )}

      {activeView === 'AUDIT' && (
        <AuditLogView 
          document={selectedCase} 
          onBack={() => setActiveView('DETAIL')}
          onSubmitReject={(id, reason) => updateStatus(id, 'rejected', { rejection_reason: reason })}
        />
      )}
    </div>
  );
};

export default HrReviewerDashboard;
```

**Step 2: Commit**

```bash
git add frontend/src/features/hr-reviewer/HrReviewerDashboard.jsx
git commit -m "feat: assemble modular HrReviewerDashboard orchestrator"
```

### Task 5: Update Router and Clean Up

**Files:**
- Modify: `frontend/src/App.jsx`
- Delete: `frontend/src/pages/HrReviewerDashboard.jsx`

**Step 1: Update routing**
Check `frontend/src/App.jsx` (or the equivalent router setup) and update the import path from `pages/HrReviewerDashboard` to `features/hr-reviewer/HrReviewerDashboard`.

*Note: Since the exact router implementation wasn't provided, use `grep_search` to find `HrReviewerDashboard` and modify the import path accordingly.*

**Step 2: Remove old file**
```bash
rm frontend/src/pages/HrReviewerDashboard.jsx
```

**Step 3: Commit**
```bash
git add -A
git commit -m "refactor: migrate HR Reviewer dashboard to feature structure"
```
