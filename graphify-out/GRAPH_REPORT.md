# Graph Report - Project  (2026-04-28)

## Corpus Check
- 37 files · ~36,235 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 83 nodes · 69 edges · 6 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `getPool()` - 8 edges
2. `useAuth()` - 8 edges
3. `recoverStuckDocuments()` - 4 edges
4. `processDocumentWithAI()` - 4 edges
5. `start()` - 3 edges
6. `initDatabase()` - 3 edges
7. `analyzeDocument()` - 3 edges
8. `reset()` - 2 edges
9. `migrate()` - 2 edges
10. `migrate()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `reset()` --calls--> `getPool()`  [INFERRED]
  backend\reset.js → backend\src\db\init.js
- `recoverStuckDocuments()` --calls--> `processDocumentWithAI()`  [INFERRED]
  backend\src\server.js → backend\src\utils\aiProcessor.js
- `migrate()` --calls--> `getPool()`  [INFERRED]
  backend\src\db\migrate_audit.js → backend\src\db\init.js
- `migrate()` --calls--> `getPool()`  [INFERRED]
  backend\src\db\migrate_hr_roles.js → backend\src\db\init.js
- `seed()` --calls--> `getPool()`  [INFERRED]
  backend\src\db\seed.js → backend\src\db\init.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (10): generateReadSasUrl(), initializeContainer(), getPool(), initDatabase(), migrate(), migrate(), reset(), seed() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (8): useAuth(), DashboardLayout(), ItAdminDashboard(), Login(), NewHireDashboard(), NewHireProfile(), ProtectedRoute(), StatusTracker()

### Community 3 - "Community 3"
Cohesion: 0.5
Nodes (2): authenticate(), validateB2CToken()

### Community 5 - "Community 5"
Cohesion: 0.83
Nodes (3): analyzeDocument(), processDocumentWithAI(), sleep()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (2): api(), handleAuthError()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (2): Avatar(), colorForName()

## Knowledge Gaps
- **Thin community `Community 3`** (5 nodes): `authenticate()`, `generateToken()`, `getSigningKey()`, `validateB2CToken()`, `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (3 nodes): `api()`, `handleAuthError()`, `api.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (3 nodes): `Avatar()`, `colorForName()`, `Avatar.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getPool()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `recoverStuckDocuments()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getPool()` (e.g. with `reset()` and `recoverStuckDocuments()`) actually correct?**
  _`getPool()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `DashboardLayout()`) actually correct?**
  _`useAuth()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `recoverStuckDocuments()` (e.g. with `getPool()` and `generateReadSasUrl()`) actually correct?**
  _`recoverStuckDocuments()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `processDocumentWithAI()` (e.g. with `recoverStuckDocuments()` and `getPool()`) actually correct?**
  _`processDocumentWithAI()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `start()` (e.g. with `initDatabase()` and `initializeContainer()`) actually correct?**
  _`start()` has 2 INFERRED edges - model-reasoned connections that need verification._