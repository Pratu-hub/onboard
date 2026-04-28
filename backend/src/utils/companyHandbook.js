/**
 * Company Handbook — Knowledge Base for the AI Copilot.
 *
 * This structured text is injected directly into the GPT system prompt
 * as a simplified RAG approach. No vector DB required.
 *
 * Keep total content under ~2000 tokens to stay within budget.
 */

const COMPANY_HANDBOOK = `
## OnboardIQ Company Handbook — Quick Reference

### 1. Leave & Time Off
- **Annual Leave:** 24 paid days per calendar year (prorated for mid-year joiners).
- **Sick Leave:** 12 days per year. A medical certificate is required for absences exceeding 3 consecutive days.
- **Casual Leave:** 6 days per year for personal matters. Must be applied for at least 24 hours in advance.
- **Parental Leave:** 26 weeks for primary caregivers, 4 weeks for secondary caregivers.
- **Public Holidays:** 10 national holidays as per the regional calendar.
- **Leave Approval:** All leave requests must be submitted via the HR portal and approved by your reporting manager.

### 2. Remote & Hybrid Work
- **Policy:** Employees are eligible for a hybrid schedule after completing their 90-day probation period.
- **Hybrid Split:** 3 days in-office (Tuesday, Wednesday, Thursday) and 2 days remote (Monday, Friday).
- **Fully Remote:** Available for select roles with VP-level approval. Contact your HR Business Partner.
- **Equipment:** The company provides a laptop, monitor, keyboard, and mouse for remote setups. See IT Support.
- **Internet Stipend:** A monthly stipend of ₹1,500 is provided for home internet costs.

### 3. IT Support & Equipment
- **Helpdesk:** Reach IT Support at it-support@onboardiq.com or via the #it-help Slack channel.
- **Laptop:** A company-issued laptop will be shipped within 3 business days of your start date.
- **Software Access:** Standard software (Slack, Jira, GitHub, Google Workspace) is provisioned automatically on Day 1.
- **VPN:** Required for accessing internal tools remotely. Setup instructions are sent via email on Day 1.
- **Password Resets:** Use the self-service portal at passwords.onboardiq.com or contact IT Support.

### 4. Health Insurance & Benefits
- **Coverage:** Group health insurance covers the employee, spouse, and up to 2 dependent children.
- **Sum Insured:** ₹5,00,000 per year (₹10,00,000 for senior roles).
- **Provider:** Star Health Insurance. Policy details are shared during your first week.
- **Dental & Vision:** Included in the group policy at no additional cost.
- **Mental Health:** Free access to counseling services via the Employee Assistance Program (EAP). Call 1800-XXX-XXXX.
- **Enrollment:** Health insurance is active from your date of joining. No waiting period.

### 5. Expense Reimbursement
- **Process:** Submit expense claims via the HR portal with receipts within 30 days of the expense.
- **Travel:** Domestic travel is reimbursed at actuals. International travel requires pre-approval from your VP.
- **Meals:** A daily meal allowance of ₹500 is provided during business travel.
- **Learning & Development:** Up to ₹50,000 per year for courses, certifications, and conferences with manager approval.
- **Reimbursement Timeline:** Claims are processed within 15 business days of submission.

### 6. Company Culture & Values
- **Core Values:** Innovation, Transparency, Ownership, Empathy.
- **Working Hours:** Standard hours are 9:30 AM to 6:30 PM IST, with 1 hour for lunch. Flexible timing is available with manager approval.
- **Dress Code:** Business casual in-office. No formal dress code for remote days.
- **Team Events:** Monthly team outings and quarterly town halls.
- **Feedback:** 360-degree performance reviews are conducted bi-annually (June and December).

### 7. Key Contacts
- **HR Team:** hr@onboardiq.com
- **IT Support:** it-support@onboardiq.com or #it-help on Slack
- **Facilities:** facilities@onboardiq.com
- **Emergency:** 112 (National Emergency Number)
- **Your HR Business Partner:** Assigned during your first week and introduced via email.
`;

module.exports = { COMPANY_HANDBOOK };
