# Welcome Hub & AI Copilot Design Document

## 1. Overview
The **Welcome Hub** is a post-onboarding destination for new hires whose documents have been fully approved by HR. It transitions the user experience from a "task-based" document upload portal to an engaging "employee intranet" experience, showcasing the end-to-end onboarding lifecycle.

## 2. Core Features
- **Smart Routing:** Upon login, if the new hire's `case_status` is `approved` or `provisioned`, they are automatically routed to the Welcome Hub instead of the Document Upload dashboard.
- **IT Provisioning Tracker:** A visual checklist displaying the status of IT setup (e.g., Email created, Slack access, Hardware shipping).
- **First 30 Days Roadmap:** A personalized timeline/checklist guiding the employee through their first weeks.
- **HR AI Copilot (Chat Widget):** A persistent chat interface where the new hire can ask policy-related questions.

## 3. Architecture & Data Flow

### 3.1 Routing & State
- Handled entirely on the frontend via React Router. The user's role and case status determine access.

### 3.2 AI Copilot Backend
- **Knowledge Base:** A static structured text file (`backend/src/utils/companyHandbook.js`) containing core company policies (PTO, WFH, Benefits, Support contacts).
- **API Endpoint:** `POST /api/chat`
- **LLM Integration:** 
  - Reuses the existing Azure OpenAI GPT-4o setup.
  - Implements a simplified Retrieval-Augmented Generation (RAG) pattern by injecting the `companyHandbook.js` content directly into the system prompt.
  - **System Prompt constraint:** "Answer using ONLY the provided handbook. If the answer is not in the text, direct the user to hr@company.com."

## 4. Security & Error Handling
- The `/api/chat` endpoint will be protected by the existing Auth0 JWT middleware.
- Only authenticated users with the `new_hire` role (or higher) can access the endpoint.
- Strict prompt engineering prevents the AI from hallucinating or answering non-company-related questions.

## 5. Implementation Phases
1. **Backend:** Create the handbook file and `/api/chat` endpoint.
2. **Frontend UI:** Build the `EmployeeHub.jsx` layout (Provisioning tracker + 30 Days plan).
3. **Frontend Integration:** Build the chat widget and wire it to the `/api/chat` endpoint.
4. **Routing:** Update the auth context / main router to direct approved hires to the new page.
