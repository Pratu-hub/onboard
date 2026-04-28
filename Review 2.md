# Cloud Computing – Project Review II  
## Team Preparation & Showcase Guidelines  

This document outlines what each team must prepare, demonstrate, and submit for Project Review II. The evaluation is based on four components totaling **75 marks**, as per the official rubric.

---

## 1. Evaluation Components and Expectations  

| Component | What Teams Must Prepare (Deliverables) | What to Showcase During Review | Expected Format / Proof Points |
|----------|----------------------------------------|--------------------------------|--------------------------------|
| **DevOps Automation & Infrastructure (20 marks)** | • Terraform Code Repository in GitHub (for Azure infra provisioning)<br>• Azure Pipeline / GitHub Actions YAML for CI/CD<br>• Documentation on pipeline stages (Build → Test → Deploy)<br>• Screenshots / logs of successful runs | • Live walkthrough of the pipeline run in Azure DevOps or GitHub Actions<br>• Show Terraform apply logs and resources created in Azure<br>• Explain how variables, secrets, and approvals are handled | • GitHub Repo Link<br>• Azure Pipeline URL<br>• PDF / Wiki summarizing CI/CD & Terraform flow |
| **Containerization & Orchestration (20 marks)** | • Dockerfile and `.dockerignore` in repo<br>• Container image pushed to ACR<br>• Kubernetes YAMLs / Helm chart for deployment<br>• Document describing environment promotion strategy (Dev → Test → Prod) | • Run container locally (`docker run` demo)<br>• Show image in ACR portal<br>• Show AKS deployment in Azure Portal / via `kubectl`<br>• Explain scaling and config management | • GitHub Repo Link<br>• Screenshots of ACR and AKS portals<br>• Optional short recording of deployment |
| **GenAI Integration & Cloud Service Mapping (20 marks)** | • GenAI Use Case Document (2–3 use cases) with mapped Azure AI services<br>• Proof of API keys and service setup in Azure Portal<br>• Demo or mockup of GenAI integration in the app (chatbot, summarizer, feedback analyzer) | • Walk through the GenAI flow in the app<br>• Explain why that AI service was chosen<br>• Show sample prompt and response output | • PDF or Slides with flow diagram<br>• Azure portal screenshots<br>• Demo video or live demo |
| **Viva / Technical Presentation (15 marks)** | • 8–10 slide deck covering:<br>&nbsp;&nbsp;- System Architecture Diagram (updated)<br>&nbsp;&nbsp;- CI/CD and Infra flow<br>&nbsp;&nbsp;- Containerization and K8s snapshots<br>&nbsp;&nbsp;- GenAI integration<br>&nbsp;&nbsp;- Team roles and lessons learned | • Each member answers specific questions on their part<br>• Explain key design decisions and trade-offs<br>• Use architecture and pipeline diagrams for reference | • PowerPoint Deck (10 slides max)<br>• Optional: 1-page summary document |

---

## 2. Submission Checklist (D-2 Deadline)

- GitHub Repo Link with Terraform, CI/CD YAMLs, Dockerfile, Kubernetes files  
- Azure Portal Access or screenshots showing deployed resources (RG, AKS, ACR, App Service, OpenAI)  
- PDF Deliverable Pack (`TeamXX_ReviewII.pdf`) containing architecture, pipeline flow, and GenAI use case mapping  
- Presentation Deck (PPTX) for review day  

---

## 3. Live Demo Expectations  

| Step | Demo Item | Duration |
|------|----------|----------|
| 1 | CI/CD Pipeline run and Terraform output | 3 mins |
| 2 | Container run and AKS deployment | 3 mins |
| 3 | GenAI use case demo / explanation | 2 mins |
| 4 | Viva / Q&A Discussion | 2 mins |

---

### Total Demo Time  
**Approximately 10 minutes per team.**

Ensure that all demos and documents are ready prior to the scheduled review session.
