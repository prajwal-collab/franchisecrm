# EarlyJobs CRM Platform
### Official User Documentation & Operating Manual

---

## 1. Introduction
Welcome to the EarlyJobs CRM. This system is purpose-built to map, track, and optimize the end-to-end journey from district mapping and initial lead qualification to full franchise launch. It features granular access control, real-time analytics, and automated onboarding workflows.

---

## 2. Roles & Access Control
The CRM utilizes a role-based access control (RBAC) system to ensure secure data handling and strict operational partitioning. 

* **Admin:** Unrestricted access. Can manage users, manipulate global settings, manage billing data, and securely import/export data.
* **Closer:** Focused on finalizing deals. Has permissions to read/write lead data, transition leads to `Closed Won`, and access Franchisee financial profiles.
* **SDR (Sales Development Rep):** Focused on outreach. Restricted to managing early-stage leads, capturing notes, and scheduling initial webinar/1:1 interactions. Cannot see financials or manipulate closed workflows.
* **Viewer:** Read-only access to specific dashboards.

> [!IMPORTANT]
> Some pages dynamically adjust visibility to hide financial or sensitive data depending on the logged-in user's role.

---

## 3. Core Modules

### 3.1. Dashboard Overview
The command center of the CRM. It collates high-level metrics (Total Leads, Active Franchisees, Districts Sold). The bottom half presents an interactive Task Manager and upcoming Scheduled Meetings specific to the logged-in user.

### 3.2. Districts Mapping
Responsible for geographical boundaries and business exclusivity.
* **District Statuses:** Available, Blocked, Sold.
* **Integrity Lock:** A district cannot be deleted or set to available if an active Franchise Partner is inherently mapped to it. 

### 3.3. Lead Management
The primary engine for pipeline progression.
* **Kanban & Grid View:** Visual drag-and-drop workflow (Kanban) or high-density quick-edit lists (Grid).
* **Automated Lead Scoring:** The CRM automatically calculates lead warmth (0-100) based on stage progression and declared investment capacity. 
* **Follow-Ups:** Setting a lead's stage to `Follow Up` will prompt for a date, automatically spawning a synced Task reminder for the assigned agent.

#### Lead Pipeline Stages:
`New Lead` ➔ `Contacted` ➔ `Follow Up` ➔ `Interested` ➔ `Webinar Registered` ➔ `Webinar Attended` ➔ `1:1 Scheduled` ➔ `Qualified` ➔ `Negotiation` ➔ `Closed Won` / `Closed Lost`

### 3.4. Franchisee Partners 
Triggered automatically when a Lead achieves the `Closed Won` status.
* **Financial Tracking:** Monitors the `Committed Amount` vs `Received Token` and actively calculates remaining financial balances.
* **Activation Workflow:** Every Franchisee record features an internally manageable `Activation Workflow` tab. This contains a fully customizable, template-based 32-step rollout sequence (ranging from KYC Documentation to Marketing setup). Agents can attach direct progress notes to every individual step.

### 3.5. Automated Tasks & Meetings
* Moving leads through predefined pipeline stages (e.g., from `Contacted` to `Interested`) will instantly spawn workflow Tasks for the SDR/Closer.
* Tasks natively surface in the `Tasks` tab, pre-assigned to the rightful owner.
* When "Follow Up" is selected via quick-action, a timestamped Task secures the lead from slipping out of contact.

---

## 4. Advanced Tooling

### Artificial Intelligence & Enrichment
The CRM embeds an interactive AI Assistant. The AI securely analyzes table structures and provides on-demand aggregations, data-cleaning, or natural language summaries of complex pipelines natively without needing secondary tools.

### Bulk Data Imports
* Authorized roles (Admin/Closer) can rapidly hydrate the database.
* The system accepts large `.csv` datasets and parses them into native Lead formats automatically while resolving assignment and mapping overrides.

---

> [!TIP]
> Always leverage the "Internal Notes" textpads available on Lead and Franchise elements. These logs persist sequentially and provide perfect handover context between the SDR team and Closing executives.
