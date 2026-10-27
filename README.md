# AutoSecure Escrow

[![Django REST Framework](https://img.shields.io/badge/DRF-3.15+-red.svg)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AutoSecure Escrow** is a full-stack web application designed to eliminate fraud and build absolute trust in peer-to-peer automotive transactions. 
By locking buyer funds in a secure escrow account until critical inspection and logistics milestones are verified, the platform protects both buyers and sellers 
throughout the vehicle purchasing lifecycle.

---

## Key Features

* **Multi-Role Access Control (RBAC):** Tailored operational dashboards and permissions for **Buyers**, **Sellers**, **Repair Shop Inspectors**, **Logistics Carriers**, and **System Arbiters**.
* **Escrow Lifecycle State Machine:** Automated contract state transitions supporting standard delivery paths, optional carrier routing, and inspection failure/dispute resolution branches.
* **Technical Inspection Workflows:** Certified repair shops can dispatch inspectors, evaluate vehicle frame/engine health, log odometer readings, and issue pass/fail verification reports.
* **Flexible Logistics Routing:** Buyers can optionally bind a logistics carrier for door-to-door vehicle delivery or choose local dealer pickup.
* **Robust JWT Authentication:** Secure login with `djangorestframework-simplejwt`, custom payload claims, and automatic token refresh interceptors on the frontend.
* **Dispute Resolution Engine:** Built-in dispute ticket creation and arbiter resolution tools to handle failed inspections, partial refunds, or payout splits safely.

---

## Tech Stack

### **Backend**
* **Framework:** Python, Django, Django REST Framework (DRF)
* **Authentication:** `djangorestframework-simplejwt`
* **Database:** MySQL
* **Utilities:** `django-cors-headers`

### **Frontend**
* **Library:** React.js (Vite)
* **Styling:** Tailwind CSS
* **HTTP Client:** Axios (with custom request/response interceptors)
* **Routing:** `react-router-dom`

---

## System Architecture & Workflow

The AutoSecure Escrow state machine safely orchestrates transactions through key verification checkpoints while accounting for optional logistics paths and inspection failure handling:

```text
[Buyer Creates Contract] 
         │
         ▼
  [Buyer Funds Escrow] ──(Funds Securely Locked)
         │
         ▼
[Inspector Submits Report] 
         │
         ├─► [Inspection Fails / Disputed] ──► [Buyer Initiates Refund / Dispute Ticket] ──► [Arbiter Resolves & Refunds Buyer]
         │
         └─► [Inspection Passes]
                   │
                   ▼
         [Is Logistics Carrier Included?]
                   │
         ┌─────────┴─────────┐
         ▼ (Yes)             ▼ (No / Local Pickup)
   [Carrier Assigned]        │
   [In-Transit Tracking]     │
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         [Buyer Approves Delivery / Inspection]
                   │
                   ▼
         [Funds Released to Seller & Contract Completed]
