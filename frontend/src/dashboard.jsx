import React, { useEffect, useState } from "react";

const API = "https://aapatsetu-ai.onrender.com";

function Dashboard() {
    const [incidents, setIncidents] = useState([]);
    const [resources, setResources] = useState([]);
    const [plan, setPlan] = useState(null);
    const [agents, setAgents] = useState(null);
    const [monitor, setMonitor] = useState(null);
    const [history, setHistory] = useState([]);
    const [audit, setAudit] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState("");

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ==================================================
    // API HELPER
    // ==================================================

    async function apiFetch(endpoint, options = {}) {
        const response = await fetch(`${API}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const text = await response.text();

        let data;

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = {
                message: text
            };
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                `Request failed with status ${response.status}`
            );
        }

        return data;
    }

    // ==================================================
    // NORMALIZE AGENTS
    // ==================================================

    function normalizeAgents(agentResponse) {
        const agentList = Array.isArray(agentResponse)
            ? agentResponse
            : Array.isArray(agentResponse?.agents)
                ? agentResponse.agents
                : [];

        const findAgent = (name) =>
            agentList.find(
                (agent) => agent.agent === name
            ) || null;

        return {
            assessment: findAgent("Assessment Agent"),
            planning: findAgent("Planning Agent"),
            security: findAgent("Security/SISO Agent"),
            human_review: findAgent("Human Review"),
            monitoring: findAgent("Monitoring Agent"),
            command_coordinator: findAgent(
                "Command Coordinator"
            ),

            plan_version:
                agentResponse?.plan_version || null,

            plan_status:
                agentResponse?.plan_status || null,

            workflow_status:
                agentResponse?.workflow_status || null,

            workflow:
                Array.isArray(agentResponse?.workflow)
                    ? agentResponse.workflow
                    : [],

            raw: agentResponse
        };
    }

    // ==================================================
    // LOAD DASHBOARD
    // ==================================================

    async function loadDashboard(showLoading = false) {
        if (showLoading) {
            setLoading(true);
        }

        try {
            setError("");

            const results = await Promise.allSettled([
                apiFetch("/incidents"),
                apiFetch("/resources"),
                apiFetch("/plan"),
                apiFetch("/agents/status"),
                apiFetch("/monitor"),
                apiFetch("/plan-history"),
                apiFetch("/audit-log")
            ]);

            const [
                incidentsResult,
                resourcesResult,
                planResult,
                agentsResult,
                monitorResult,
                historyResult,
                auditResult
            ] = results;

            // -----------------------------
            // INCIDENTS
            // -----------------------------

            if (incidentsResult.status === "fulfilled") {
                const data = incidentsResult.value;

                setIncidents(
                    Array.isArray(data)
                        ? data
                        : data.incidents || []
                );
            }

            // -----------------------------
            // RESOURCES
            // -----------------------------

            if (resourcesResult.status === "fulfilled") {
                const data = resourcesResult.value;

                setResources(
                    Array.isArray(data)
                        ? data
                        : data.resources || []
                );
            }

            // -----------------------------
            // PLAN
            // -----------------------------

            if (planResult.status === "fulfilled") {
                setPlan(planResult.value);
            }

            // -----------------------------
            // AGENTS
            // -----------------------------

            if (agentsResult.status === "fulfilled") {
                setAgents(
                    normalizeAgents(
                        agentsResult.value
                    )
                );
            }

            // -----------------------------
            // MONITOR
            // -----------------------------

            if (monitorResult.status === "fulfilled") {
                setMonitor(
                    monitorResult.value
                );
            }

            // -----------------------------
            // HISTORY
            // -----------------------------

            if (historyResult.status === "fulfilled") {
                const data = historyResult.value;

                setHistory(
                    Array.isArray(data)
                        ? data
                        : data.history || []
                );
            }

            // -----------------------------
            // AUDIT
            // -----------------------------

            if (auditResult.status === "fulfilled") {
                const data = auditResult.value;

                setAudit(
                    data.audit || data
                );
            }

            const failedRequests =
                results.filter(
                    result =>
                        result.status ===
                        "rejected"
                );

            if (failedRequests.length > 0) {
                console.warn(
                    "Some API requests failed:",
                    failedRequests
                );
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // INITIAL LOAD + AUTO REFRESH
    // ==================================================

    useEffect(() => {
        loadDashboard(true);

        const timer = setInterval(() => {
            loadDashboard(false);
        }, 15000);

        return () => clearInterval(timer);
    }, []);

    // ==================================================
    // ACTION HELPER
    // ==================================================

    async function performAction(
        endpoint,
        successMessage
    ) {
        try {
            setActionLoading(true);
            setError("");
            setMessage("");

            await apiFetch(endpoint, {
                method: "POST"
            });

            setMessage(successMessage);

            await loadDashboard(false);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    // ==================================================
    // PLAN ACTIONS
    // ==================================================

    async function approvePlan() {
        await performAction(
            "/approve-plan",
            "Plan approved successfully."
        );
    }

    async function rejectPlan() {
        await performAction(
            "/reject-plan",
            "Plan rejected."
        );
    }

    async function replan() {
        await performAction(
            "/replan",
            "New response plan generated."
        );
    }

    // ==================================================
    // AI EXPLANATION
    // ==================================================

    async function generateAIExplanation() {
        try {
            setActionLoading(true);
            setError("");
            setMessage("");

            const data = await apiFetch(
                "/ai/explain-plan"
            );

            setAiAnalysis(
                data.ai_analysis?.summary ||
                data.summary ||
                data.explanation ||
                data.message ||
                "No AI explanation returned."
            );

            setMessage(
                "AI explanation generated."
            );

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    // ==================================================
    // SIMULATIONS
    // ==================================================

    async function simulateNewEmergency() {
        await performAction(
            "/simulate/new-emergency",
            "New emergency simulated."
        );
    }

    async function simulateResourceFailure() {
        await performAction(
            "/simulate/resource-failure",
            "Resource failure simulated."
        );
    }

    async function simulateSeverityIncrease() {
        await performAction(
            "/simulate/increase-severity",
            "Incident severity increased."
        );
    }

    // ==================================================
    // SISO SIMULATION
    // ==================================================

    async function simulateSecurityWarning() {
        await performAction(
            "/simulate/security-warning",
            "Security/SISO warning simulation activated."
        );
    }

    async function resetSecurity() {
        await performAction(
            "/simulate/security-reset",
            "Security/SISO simulation reset."
        );
    }

    // ==================================================
    // COMPLETE RESET
    // ==================================================

    async function resetSimulation() {
        try {
            setActionLoading(true);
            setError("");
            setMessage("");

            await apiFetch(
                "/reset",
                {
                    method: "POST"
                }
            );

            setMessage(
                "Simulation reset successfully."
            );

            setAiAnalysis("");

            await loadDashboard(false);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    // ==================================================
    // HELPERS
    // ==================================================

    function getPlanStatus() {
        if (!plan) {
            return "Loading";
        }

        return plan.status || "Unknown";
    }

    function getSecurityStatus() {
        if (!agents) {
            return "Loading";
        }

        return (
            agents.security?.status ||
            "Unknown"
        );
    }

    function getWorkflowStatus() {
        if (!agents) {
            return "Loading";
        }

        return (
            agents.workflow_status ||
            agents.command_coordinator?.status ||
            "Unknown"
        );
    }

    function getAssignmentCount() {
        if (
            !plan ||
            !Array.isArray(plan.plan)
        ) {
            return 0;
        }

        return plan.plan.filter(
            item =>
                item.status === "Assigned"
        ).length;
    }

    function getHumanAttentionCount() {
        if (
            !plan ||
            !Array.isArray(plan.plan)
        ) {
            return 0;
        }

        return plan.plan.filter(
            item =>
                item.status ===
                "Human Attention Required"
        ).length;
    }

    function getCriticalIncidents() {
        return incidents.filter(
            incident =>
                incident.severity ===
                "Critical"
        ).length;
    }

    function getAvailableResources() {
        return resources.filter(
            resource =>
                String(resource.status)
                    .toLowerCase() ===
                "available"
        ).length;
    }

    function getUnavailableResources() {
        return resources.filter(
            resource =>
                String(resource.status)
                    .toLowerCase() !==
                "available"
        ).length;
    }

    function getStatusClass(status) {
        const value = String(
            status || ""
        ).toLowerCase();

        if (
            value.includes("passed") ||
            value.includes("active") ||
            value.includes("approved") ||
            value.includes("assigned") ||
            value.includes("available") ||
            value.includes("completed") ||
            value.includes("operational")
        ) {
            return "success";
        }

        if (
            value.includes("warning") ||
            value.includes("pending") ||
            value.includes("attention") ||
            value.includes("waiting") ||
            value.includes("monitoring") ||
            value.includes("critical") ||
            value.includes("high")
        ) {
            return "warning";
        }

        if (
            value.includes("rejected") ||
            value.includes("failed") ||
            value.includes("outdated") ||
            value.includes("unavailable")
        ) {
            return "danger";
        }

        return "neutral";
    }

    function formatStatus(status) {
        if (!status) {
            return "Unknown";
        }

        return String(status)
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );
    }

    // ==================================================
    // LOADING
    // ==================================================

    if (loading && !plan) {
        return (
            <div className="loading-page">

                <div className="loading-box">

                    <div className="loading-icon">
                        🚨
                    </div>

                    <h1>
                        AapatSetu AI
                    </h1>

                    <p>
                        Connecting to Emergency Command Center...
                    </p>

                    <div className="spinner"></div>

                </div>

            </div>
        );
    }

    // ==================================================
    // MAIN DASHBOARD
    // ==================================================

    return (
        <div className="app">

            {/* ==========================================
                HEADER
            ========================================== */}

            <header className="topbar">

                <div className="brand">

                    <div className="brand-logo">
                        🚨
                    </div>

                    <div>

                        <div className="brand-title">
                            AapatSetu AI
                        </div>

                        <div className="brand-subtitle">
                            Emergency Command Center
                        </div>

                    </div>

                </div>

                <div className="topbar-right">

                    <TopStatus
                        label="SYSTEM"
                        status={
                            error
                                ? "Connection Warning"
                                : "Online"
                        }
                    />

                    <TopStatus
                        label="SISO"
                        status={
                            getSecurityStatus()
                        }
                    />

                    <TopStatus
                        label="PLAN"
                        status={
                            getPlanStatus()
                        }
                    />

                </div>

            </header>

            <main className="dashboard">

                {/* ======================================
                    ERROR / SUCCESS
                ====================================== */}

                {error && (
                    <div className="alert alert-danger">

                        <div>
                            <strong>
                                ⚠️ System Alert
                            </strong>

                            <div>
                                {error}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="alert-button"
                            onClick={() =>
                                loadDashboard(true)
                            }
                        >
                            Retry
                        </button>

                    </div>
                )}

                {message && (
                    <div className="alert alert-success">
                        <strong>
                            ✅
                        </strong>

                        <span>
                            {message}
                        </span>
                    </div>
                )}

                {/* ======================================
                    COMMAND CENTER TITLE
                ====================================== */}

                <section className="hero-section">

                    <div>

                        <div className="eyebrow">
                            LIVE EMERGENCY OPERATIONS
                        </div>

                        <h1>
                            Command Center
                        </h1>

                        <p>
                            Monitor incidents, coordinate resources,
                            validate response plans and keep a human
                            operator in control.
                        </p>

                    </div>

                    <div className="hero-status">

                        <div className="hero-status-label">
                            CURRENT WORKFLOW
                        </div>

                        <div className="hero-status-value">
                            {formatStatus(
                                getWorkflowStatus()
                            )}
                        </div>

                        <div className="hero-status-small">
                            Auto-refresh every 15 seconds
                        </div>

                    </div>

                </section>

                {/* ======================================
                    KPI CARDS
                ====================================== */}

                <section>

                    <div className="section-heading">
                        <div>
                            <div className="section-kicker">
                                SITUATION AWARENESS
                            </div>

                            <h2>
                                Operational Overview
                            </h2>
                        </div>
                    </div>

                    <div className="kpi-grid">

                        <KpiCard
                            icon="🚨"
                            label="Active Incidents"
                            value={incidents.length}
                            tone="red"
                        />

                        <KpiCard
                            icon="🔥"
                            label="Critical Incidents"
                            value={getCriticalIncidents()}
                            tone="orange"
                        />

                        <KpiCard
                            icon="🚑"
                            label="Available Resources"
                            value={
                                getAvailableResources()
                            }
                            tone="green"
                        />

                        <KpiCard
                            icon="📋"
                            label="Current Plan"
                            value={
                                plan?.version ||
                                agents?.plan_version ||
                                "V1"
                            }
                            tone="blue"
                        />

                        <KpiCard
                            icon="👤"
                            label="Human Attention"
                            value={
                                getHumanAttentionCount()
                            }
                            tone="purple"
                        />

                    </div>

                </section>

                {/* ======================================
                    CURRENT RESPONSE PLAN
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="RESPONSE COORDINATION"
                        title="Current Response Plan"
                        description="The deterministic planning engine coordinates available resources. A human operator controls final approval."
                    />

                    {plan && (
                        <div className="plan-overview">

                            <div className="plan-overview-main">

                                <div className="plan-version-large">
                                    {plan.version || "V1"}
                                </div>

                                <div>

                                    <div className="small-label">
                                        RESPONSE PLAN
                                    </div>

                                    <div className="plan-title">
                                        Emergency Resource Allocation
                                    </div>

                                    <div className="plan-reason-small">
                                        {plan.change_reason ||
                                            "Initial response plan"}
                                    </div>

                                </div>

                            </div>

                            <StatusBadge
                                status={
                                    plan.status ||
                                    "Unknown"
                                }
                            />

                        </div>
                    )}

                    {Array.isArray(plan?.plan) &&
                        plan.plan.length > 0 && (

                            <div className="plan-grid">

                                {plan.plan.map(
                                    (
                                        assignment,
                                        index
                                    ) => (

                                        <AssignmentCard
                                            key={`${assignment.incident_id}-${assignment.resource_id}-${index}`}
                                            assignment={
                                                assignment
                                            }
                                        />

                                    )
                                )}

                            </div>

                        )}

                    <div className="action-bar">

                        <button
                            type="button"
                            className="button button-success"
                            onClick={
                                approvePlan
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            ✅ Approve Plan
                        </button>

                        <button
                            type="button"
                            className="button button-danger"
                            onClick={
                                rejectPlan
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            ❌ Reject Plan
                        </button>

                        <button
                            type="button"
                            className="button button-dark"
                            onClick={
                                replan
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            🔄 Re-plan
                        </button>

                        <button
                            type="button"
                            className="button button-purple"
                            onClick={
                                generateAIExplanation
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            🤖 Explain with AI
                        </button>

                    </div>

                </section>

                {/* ======================================
                    HUMAN REVIEW
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="HUMAN-IN-THE-LOOP"
                        title="Command Approval"
                        description="AapatSetu AI recommends actions, but an emergency operator remains responsible for final authorization."
                    />

                    <div
                        className={`human-command ${getStatusClass(
                            agents?.human_review?.status
                        )}`}
                    >

                        <div className="human-icon">
                            👤
                        </div>

                        <div className="human-content">

                            <div className="small-label">
                                HUMAN REVIEW AGENT
                            </div>

                            <h3>
                                {formatStatus(
                                    agents?.human_review
                                        ?.status ||
                                    "Waiting for Human Approval"
                                )}
                            </h3>

                            <p>
                                {agents?.human_review
                                    ?.action ||
                                    "Human approval is required before the response plan becomes active."}
                            </p>

                            <div className="human-meta">

                                <span>
                                    Plan
                                </span>

                                <strong>
                                    {plan?.version ||
                                        agents?.plan_version ||
                                        "V1"}
                                </strong>

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {formatStatus(
                                        getPlanStatus()
                                    )}
                                </strong>

                            </div>

                        </div>

                        <div className="human-actions">

                            <button
                                type="button"
                                className="button button-success"
                                onClick={
                                    approvePlan
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Approve
                            </button>

                            <button
                                type="button"
                                className="button button-danger"
                                onClick={
                                    rejectPlan
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Reject
                            </button>

                        </div>

                    </div>

                </section>

                {/* ======================================
                    SISO
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="SECURITY & SAFETY"
                        title="Security / SISO Validation"
                        description="The SISO layer validates emergency data and response plans before human approval."
                    />

                    <div className="security-dashboard">

                        <div className="security-main">

                            <div className="security-shield">
                                🛡️
                            </div>

                            <div>

                                <div className="small-label">
                                    SECURITY STATUS
                                </div>

                                <h3
                                    className={`security-value ${getStatusClass(
                                        getSecurityStatus()
                                    )}`}
                                >
                                    {formatStatus(
                                        getSecurityStatus()
                                    )}
                                </h3>

                                <p>
                                    {getSecurityStatus() ===
                                        "Passed"
                                        ? "All current security validation checks have passed."
                                        : "Security validation requires attention before approval."}
                                </p>

                            </div>

                        </div>

                        <div className="security-stat">

                            <span>
                                Duplicate Incidents
                            </span>

                            <strong>
                                {audit?.duplicate_incidents
                                    ?.length ?? 0}
                            </strong>

                        </div>

                        <div className="security-stat">

                            <span>
                                Invalid Resources
                            </span>

                            <strong>
                                {audit?.invalid_resources
                                    ?.length ?? 0}
                            </strong>

                        </div>

                        <div className="security-stat">

                            <span>
                                Plan Errors
                            </span>

                            <strong>
                                {audit?.plan_errors
                                    ?.length ?? 0}
                            </strong>

                        </div>

                    </div>

                    <div className="action-bar">

                        <button
                            type="button"
                            className="button button-warning"
                            onClick={
                                simulateSecurityWarning
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            ⚠️ Simulate SISO Warning
                        </button>

                        <button
                            type="button"
                            className="button button-dark"
                            onClick={
                                resetSecurity
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            🛡️ Reset SISO
                        </button>

                    </div>

                </section>

                {/* ======================================
                    MULTI AGENT WORKFLOW
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="MULTI-AGENT ARCHITECTURE"
                        title="Emergency Response Workflow"
                        description="Six specialized components work together while human authority remains in the loop."
                    />

                    <div className="workflow">

                        <WorkflowAgent
                            step="01"
                            icon="🔎"
                            name="Assessment Agent"
                            data={
                                agents?.assessment
                            }
                        />

                        <WorkflowConnector />

                        <WorkflowAgent
                            step="02"
                            icon="🧠"
                            name="Planning Agent"
                            data={
                                agents?.planning
                            }
                        />

                        <WorkflowConnector />

                        <WorkflowAgent
                            step="03"
                            icon="🛡️"
                            name="Security / SISO"
                            data={
                                agents?.security
                            }
                        />

                        <WorkflowConnector />

                        <WorkflowAgent
                            step="04"
                            icon="👤"
                            name="Human Review"
                            data={
                                agents?.human_review
                            }
                            human
                        />

                        <WorkflowConnector />

                        <WorkflowAgent
                            step="05"
                            icon="📡"
                            name="Monitoring Agent"
                            data={
                                agents?.monitoring
                            }
                        />

                        <WorkflowConnector />

                        <WorkflowAgent
                            step="06"
                            icon="🎯"
                            name="Command Coordinator"
                            data={
                                agents?.command_coordinator
                            }
                        />

                    </div>

                </section>

                {/* ======================================
                    INCIDENTS + RESOURCES
                ====================================== */}

                <div className="two-column">

                    <section className="section">

                        <SectionHeader
                            kicker="SITUATION"
                            title="Emergency Incidents"
                            description="Active incidents currently being monitored."
                        />

                        <div className="stack">

                            {incidents.length === 0 ? (
                                <EmptyState
                                    text="No incidents found."
                                />
                            ) : (
                                incidents.map(
                                    incident => (
                                        <IncidentCard
                                            key={
                                                incident.id
                                            }
                                            incident={
                                                incident
                                            }
                                        />
                                    )
                                )
                            )}

                        </div>

                    </section>

                    <section className="section">

                        <SectionHeader
                            kicker="LOGISTICS"
                            title="Emergency Resources"
                            description="Current emergency resources and availability."
                        />

                        <div className="stack">

                            {resources.length === 0 ? (
                                <EmptyState
                                    text="No resources found."
                                />
                            ) : (
                                resources.map(
                                    resource => (
                                        <ResourceCard
                                            key={
                                                resource.id
                                            }
                                            resource={
                                                resource
                                            }
                                        />
                                    )
                                )
                            )}

                        </div>

                        <div className="resource-summary">

                            <div>
                                <span>
                                    Available
                                </span>

                                <strong>
                                    {getAvailableResources()}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Assigned / unavailable
                                </span>

                                <strong>
                                    {getUnavailableResources()}
                                </strong>
                            </div>

                        </div>

                    </section>

                </div>

                {/* ======================================
                    MONITORING
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="CONTINUOUS MONITORING"
                        title="Live Monitoring"
                        description="The monitoring agent watches for changes that may require a new response plan."
                    />

                    <div className="monitor-dashboard">

                        <div className="monitor-number">

                            <div className="small-label">
                                CHANGES DETECTED
                            </div>

                            <strong>
                                {monitor?.changes_detected ?? 0}
                            </strong>

                        </div>

                        <div className="monitor-action">

                            <div className="small-label">
                                RECOMMENDED ACTION
                            </div>

                            <strong>
                                {monitor?.action ||
                                    "No action required."}
                            </strong>

                        </div>

                    </div>

                    {Array.isArray(
                        monitor?.changes
                    ) &&
                        monitor.changes.length > 0 && (

                            <div className="change-list">

                                {monitor.changes.map(
                                    (
                                        change,
                                        index
                                    ) => (

                                        <div
                                            className="change-item"
                                            key={
                                                index
                                            }
                                        >

                                            <div className="change-icon">
                                                ⚠️
                                            </div>

                                            <div>

                                                <strong>
                                                    {change.type}
                                                </strong>

                                                <p>
                                                    {change.reason}
                                                </p>

                                                {change.action && (
                                                    <small>
                                                        Action:{" "}
                                                        {
                                                            change.action
                                                        }
                                                    </small>
                                                )}

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                </section>

                {/* ======================================
                    AI EXPLANATION
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="AI COMMAND ASSISTANT"
                        title="Response Explanation"
                        description="The LLM explains the deterministic planner's decisions without making the resource-allocation decision itself."
                    />

                    {aiAnalysis ? (

                        <div className="ai-panel">

                            <div className="ai-panel-header">

                                <span>
                                    🤖
                                </span>

                                <div>

                                    <strong>
                                        AapatSetu AI Explanation
                                    </strong>

                                    <small>
                                        Groq-powered explanation layer
                                    </small>

                                </div>

                            </div>

                            <pre>
                                {aiAnalysis}
                            </pre>

                        </div>

                    ) : (

                        <div className="ai-empty">

                            <div className="ai-empty-icon">
                                🤖
                            </div>

                            <div>

                                <strong>
                                    AI explanation not generated yet
                                </strong>

                                <p>
                                    Click "Explain with AI" in the
                                    response plan section to explain
                                    the current emergency plan.
                                </p>

                            </div>

                        </div>

                    )}

                </section>

                {/* ======================================
                    PLAN HISTORY
                ====================================== */}

                <section className="section">

                    <SectionHeader
                        kicker="DECISION HISTORY"
                        title="Plan History"
                        description="Every generated response plan is preserved for traceability."
                    />

                    <div className="history">

                        {history.length === 0 ? (

                            <EmptyState
                                text="No plan history available."
                            />

                        ) : (

                            history.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <div
                                        className="history-item"
                                        key={
                                            index
                                        }
                                    >

                                        <div className="history-version">

                                            <span>
                                                {item.version ||
                                                    `Plan ${index + 1}`}
                                            </span>

                                            <small>
                                                {item.change_reason ||
                                                    "Response plan generated"}
                                            </small>

                                        </div>

                                        <StatusBadge
                                            status={
                                                item.status ||
                                                "Unknown"
                                            }
                                        />

                                    </div>

                                )
                            )

                        )}

                    </div>

                </section>

                {/* ======================================
                    SIMULATION CONTROLS
                ====================================== */}

                <section className="section simulation-section">

                    <SectionHeader
                        kicker="WHAT-IF TESTING"
                        title="Emergency Simulation Controls"
                        description="Use these controls during the hackathon demonstration to show how AapatSetu AI responds to changing conditions."
                    />

                    <div className="simulation-grid">

                        <SimulationButton
                            icon="🚨"
                            title="New Emergency"
                            description="Introduce a new critical emergency."
                            onClick={
                                simulateNewEmergency
                            }
                            disabled={
                                actionLoading
                            }
                        />

                        <SimulationButton
                            icon="🚑"
                            title="Resource Failure"
                            description="Simulate the loss of an emergency resource."
                            onClick={
                                simulateResourceFailure
                            }
                            disabled={
                                actionLoading
                            }
                        />

                        <SimulationButton
                            icon="🔥"
                            title="Increase Severity"
                            description="Increase the severity of an active incident."
                            onClick={
                                simulateSeverityIncrease
                            }
                            disabled={
                                actionLoading
                            }
                        />

                        <SimulationButton
                            icon="🔄"
                            title="Reset Simulation"
                            description="Return the system to the initial scenario."
                            onClick={
                                resetSimulation
                            }
                            disabled={
                                actionLoading
                            }
                            reset
                        />

                    </div>

                </section>

            </main>

            {/* ==========================================
                FOOTER
            ========================================== */}

            <footer className="footer">

                <div>
                    <strong>
                        AapatSetu AI
                    </strong>

                    <span>
                        Human-in-the-loop Emergency Response System
                    </span>
                </div>

                <div>
                    Binary Bosses • Emergency Command System
                </div>

            </footer>

        </div>
    );
}

// ==================================================
// TOP STATUS
// ==================================================

function TopStatus({
    label,
    status
}) {
    return (
        <div className="top-status">

            <span>
                {label}
            </span>

            <StatusBadge
                status={status}
            />

        </div>
    );
}

// ==================================================
// SECTION HEADER
// ==================================================

function SectionHeader({
    kicker,
    title,
    description
}) {
    return (
        <div className="section-heading">

            <div>

                <div className="section-kicker">
                    {kicker}
                </div>

                <h2>
                    {title}
                </h2>

                {description && (
                    <p>
                        {description}
                    </p>
                )}

            </div>

        </div>
    );
}

// ==================================================
// KPI CARD
// ==================================================

function KpiCard({
    icon,
    label,
    value,
    tone
}) {
    return (
        <div className={`kpi-card ${tone}`}>

            <div className="kpi-icon">
                {icon}
            </div>

            <div>

                <div className="kpi-label">
                    {label}
                </div>

                <div className="kpi-value">
                    {value}
                </div>

            </div>

        </div>
    );
}

// ==================================================
// STATUS BADGE
// ==================================================

function StatusBadge({
    status
}) {
    const value =
        String(status || "Unknown");

    const lower =
        value.toLowerCase();

    let className =
        "badge-neutral";

    if (
        lower.includes("passed") ||
        lower.includes("active") ||
        lower.includes("approved") ||
        lower.includes("assigned") ||
        lower.includes("available") ||
        lower.includes("completed") ||
        lower.includes("operational") ||
        lower === "online"
    ) {
        className =
            "badge-success";
    } else if (
        lower.includes("warning") ||
        lower.includes("pending") ||
        lower.includes("attention") ||
        lower.includes("waiting") ||
        lower.includes("monitoring") ||
        lower.includes("critical") ||
        lower.includes("high")
    ) {
        className =
            "badge-warning";
    } else if (
        lower.includes("rejected") ||
        lower.includes("failed") ||
        lower.includes("outdated") ||
        lower.includes("unavailable") ||
        lower.includes("connection")
    ) {
        className =
            "badge-danger";
    }

    return (
        <span
            className={`status-badge ${className}`}
        >
            {value}
        </span>
    );
}

// ==================================================
// ASSIGNMENT CARD
// ==================================================

function AssignmentCard({
    assignment
}) {
    const attention =
        assignment.status ===
        "Human Attention Required";

    return (
        <div
            className={`assignment-card ${
                attention
                    ? "attention"
                    : "assigned"
            }`}
        >

            <div className="assignment-top">

                <div>

                    <span className="incident-id">
                        {assignment.incident_id}
                    </span>

                    <h3>
                        {assignment.incident_type}
                    </h3>

                </div>

                <StatusBadge
                    status={
                        assignment.status
                    }
                />

            </div>

            <div className="assignment-details">

                <div>
                    <span>Location</span>
                    <strong>
                        📍 {assignment.location}
                    </strong>
                </div>

                <div>
                    <span>Severity</span>
                    <strong>
                        🔥 {assignment.severity}
                    </strong>
                </div>

                <div>
                    <span>Resource</span>
                    <strong>
                        🚑{" "}
                        {assignment.resource_id ||
                            "None available"}
                    </strong>
                </div>

            </div>

            {assignment.reason && (
                <div className="assignment-reason">

                    <strong>
                        Decision reason
                    </strong>

                    <p>
                        {assignment.reason}
                    </p>

                </div>
            )}

        </div>
    );
}

// ==================================================
// WORKFLOW AGENT
// ==================================================

function WorkflowAgent({
    step,
    icon,
    name,
    data,
    human = false
}) {
    const status =
        data?.status ||
        "Waiting";

    return (
        <div
            className={`workflow-agent ${
                human
                    ? "workflow-human"
                    : ""
            } ${getWorkflowAgentClass(
                status
            )}`}
        >

            <div className="workflow-step">
                {step}
            </div>

            <div className="workflow-icon">
                {icon}
            </div>

            <div className="workflow-content">

                <div className="workflow-name">
                    {name}
                </div>

                <div className="workflow-role">
                    {data?.role ||
                        "Emergency response workflow component."}
                </div>

                <StatusBadge
                    status={status}
                />

            </div>

        </div>
    );
}

function WorkflowConnector() {
    return (
        <div className="workflow-connector">
            ↓
        </div>
    );
}

function getWorkflowAgentClass(status) {
    const value =
        String(status || "")
            .toLowerCase();

    if (
        value.includes("passed") ||
        value.includes("completed") ||
        value.includes("approved") ||
        value.includes("active")
    ) {
        return "workflow-success";
    }

    if (
        value.includes("warning") ||
        value.includes("pending") ||
        value.includes("waiting") ||
        value.includes("monitoring")
    ) {
        return "workflow-warning";
    }

    if (
        value.includes("rejected") ||
        value.includes("failed")
    ) {
        return "workflow-danger";
    }

    return "workflow-neutral";
}

// ==================================================
// INCIDENT CARD
// ==================================================

function IncidentCard({
    incident
}) {
    return (
        <div
            className={`incident-card ${
                String(
                    incident.severity
                ).toLowerCase()
            }`}
        >

            <div className="item-top">

                <div className="item-id">
                    {incident.id}
                </div>

                <StatusBadge
                    status={
                        incident.severity
                    }
                />

            </div>

            <h3>
                {incident.type}
            </h3>

            <div className="item-details">

                <span>
                    📍 {incident.location}
                </span>

                <span>
                    📌{" "}
                    {formatReadableStatus(
                        incident.status
                    )}
                </span>

            </div>

            <div className="resource-tags">

                {(incident.required_resources ||
                    []).map(
                        resource => (
                            <span
                                key={
                                    resource
                                }
                            >
                                {resource}
                            </span>
                        )
                    )}

            </div>

        </div>
    );
}

// ==================================================
// RESOURCE CARD
// ==================================================

function ResourceCard({
    resource
}) {
    return (
        <div className="resource-card">

            <div className="item-top">

                <div className="item-id">
                    {resource.id}
                </div>

                <StatusBadge
                    status={
                        resource.status
                    }
                />

            </div>

            <h3>
                {resource.type}
            </h3>

            <div className="item-details">

                <span>
                    📍 {resource.location}
                </span>

                <span>
                    Status:{" "}
                    {formatReadableStatus(
                        resource.status
                    )}
                </span>

            </div>

        </div>
    );
}

// ==================================================
// SIMULATION BUTTON
// ==================================================

function SimulationButton({
    icon,
    title,
    description,
    onClick,
    disabled,
    reset = false
}) {
    return (
        <button
            type="button"
            className={`simulation-card ${
                reset
                    ? "simulation-reset"
                    : ""
            }`}
            onClick={onClick}
            disabled={disabled}
        >

            <span className="simulation-icon">
                {icon}
            </span>

            <span className="simulation-title">
                {title}
            </span>

            <span className="simulation-description">
                {description}
            </span>

        </button>
    );
}

// ==================================================
// EMPTY STATE
// ==================================================

function EmptyState({
    text
}) {
    return (
        <div className="empty-state">
            {text}
        </div>
    );
}

// ==================================================
// FORMAT HELPER
// ==================================================

function formatReadableStatus(
    status
) {
    if (!status) {
        return "Unknown";
    }

    return String(status)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}

export default Dashboard;