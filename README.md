# AapatSetu AI

AapatSetu AI is a multi-agent emergency response and resource coordination system designed to help emergency operators assess incidents, allocate limited resources, monitor changes, and approve response plans.

## 🚨 Features

- Multi-agent emergency assessment
- Severity-based resource allocation
- Same-zone resource preference
- Human-in-the-loop approval
- Security/SISO validation
- Emergency monitoring
- Automatic response-plan re-planning
- New emergency simulation
- Resource failure simulation
- Severity increase simulation
- AI-generated plan explanations
- Plan history and version tracking
- Audit logging
- Emergency command dashboard

## 🔄 System Workflow

```text
Emergency Incident
        ↓
Assessment Agent
        ↓
Planning Agent
        ↓
Security / SISO Agent
        ↓
Human Review
        ↓
Approved Response Plan
        ↓
Monitoring Agent
        ↓
Change Detected
        ↓
Re-planning Agent
        ↓
New Response Plan
🤖 Multi-Agent System
Assessment Agent

Analyzes emergency incidents and identifies required resources.

Planning Agent

Allocates available resources based on emergency severity, resource type, and location.

Security/SISO Agent

Validates incidents, resources, and response plans before approval.

Human Review

Allows an emergency operator to approve, reject, or modify a response plan.

Monitoring Agent

Monitors incidents and resources for changes.

Re-planning Agent

Generates a new response plan when emergency conditions change.

Command Coordinator

Coordinates the complete emergency response workflow.

🚑 Resource Allocation

Incidents are prioritized using:

Critical > High > Medium > Low

The system prefers available resources located in the same zone as the emergency.

When a required resource is unavailable, the system marks the assignment as:

Human Attention Required

This allows a human operator to handle situations where automated allocation is not possible.

👤 Human-in-the-Loop

Response plans are initially created with:

Pending Approval

An emergency operator can:

Approve a plan
Reject a plan
Modify resource assignments
Review security validation
Review plan history

This keeps a human decision-maker involved in the emergency response process.

🔐 Security / SISO

AapatSetu AI includes a Security/SISO validation layer.

It validates:

Incident data
Resource data
Resource assignments
Response plans

The system also provides a controlled security-warning simulation.

When a security warning is active, plan approval is blocked until the security issue is resolved.

🧠 AI Explanation

AapatSetu AI uses an LLM to explain response plans and detected changes.

The AI explanation layer helps the operator understand:

Why resources were assigned
Which incidents require attention
What changed between response plans
Why re-planning was triggered

The AI explanation layer does not make the final resource allocation decision.

🛠️ Technology Stack
Backend
Python
FastAPI
Uvicorn
Frontend
React
Vite
JavaScript
CSS
AI
Groq
OpenAI-compatible API
GPT-OSS-20B
Deployment
Render
Version Control
Git
GitHub
📁 Project Structure
AapatSetuAI/
│
├── backend/
│   ├── main.py
│   ├── agents.py
│   ├── planner.py
│   ├── security.py
│   ├── multi_agent.py
│   └── ai_agent.py
│
├── data/
│   ├── incidents.json
│   └── resources.json
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── dashboard.jsx
│       └── style.css
│
├── .gitignore
└── README.md
💻 Running Locally
Backend
cd C:\AapatSetuAI
python -m uvicorn backend.main:app --reload

Backend:

http://127.0.0.1:8000
Frontend

Open another terminal:

cd C:\AapatSetuAI\frontend
npm install
npm run dev

Frontend:

http://localhost:5173
🌐 Live Deployment

Backend:

https://aapatsetu-ai.onrender.com

GitHub:

https://github.com/Anamolsnwr/AapatSetuAI

🧪 Demo Scenarios

The system supports emergency scenarios such as:

Road Accident
Building Evacuation
Medical Emergency
Chemical Factory Accident
Factory Fire Emergency

The dashboard can simulate:

New Emergency
      ↓
Resource Failure
      ↓
Severity Increase
      ↓
Monitoring
      ↓
Re-planning
      ↓
Human Approval
📊 API Endpoints
GET  /
GET  /incidents
GET  /resources
GET  /plan
GET  /plan-history
GET  /monitor
GET  /agents/status
GET  /security-status
GET  /audit-log

POST /approve-plan
POST /reject-plan
POST /modify-plan
POST /replan

POST /simulate/new-emergency
POST /simulate/resource-failure
POST /simulate/increase-severity
POST /simulate/security-warning
POST /simulate/security-reset
POST /reset

POST /ai/explain-plan
POST /ai/explain-change
👥 Team
Binary Bosses
Anamol Sunuwar — Captain
Sajan Jaiswal
Kapil Singh
🎯 Purpose

AapatSetu AI demonstrates how multi-agent systems, deterministic resource coordination, AI explanations, security validation, monitoring, and human oversight can work together to support emergency response operations.

AapatSetu AI is a prototype for emergency response coordination and should not replace trained emergency personnel or official emergency response systems.
