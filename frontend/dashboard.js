const API = "https://aapatsetu-ai.onrender.com";

let refreshTimer = null;
let dashboardLoading = false;


// ======================================================
// API REQUEST
// ======================================================

async function getData(url, options = {}) {

    const response = await fetch(
        url,
        options
    );

    if (!response.ok) {

        let message =
            `HTTP ${response.status}`;

        try {

            const error =
                await response.json();

            message =
                error.detail ||
                error.message ||
                message;

        } catch (error) {
            // No JSON error response
        }

        throw new Error(message);
    }

    return await response.json();
}


// ======================================================
// HTML SAFETY
// ======================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// SYSTEM STATUS
// ======================================================

async function checkSystemStatus() {

    const statusText =
        document.getElementById(
            "system-status-text"
        );

    const statusDot =
        document.getElementById(
            "system-status-dot"
        );

    const statusContainer =
        document.getElementById(
            "system-status"
        );

    if (!statusText || !statusDot) {
        return;
    }

    try {

        const data =
            await getData(API);

        if (
            data &&
            data.status === "running"
        ) {

            statusText.textContent =
                "System Online";

            statusDot.className =
                "status-dot online";

            if (statusContainer) {

                statusContainer.title =
                    "AapatSetu AI backend is connected";
            }

        } else {

            statusText.textContent =
                "System Warning";

            statusDot.className =
                "status-dot warning";

            if (statusContainer) {

                statusContainer.title =
                    "Backend responded with an unexpected status";
            }
        }

    } catch (error) {

        console.error(
            "System status error:",
            error
        );

        statusText.textContent =
            "System Offline";

        statusDot.className =
            "status-dot offline";

        if (statusContainer) {

            statusContainer.title =
                "Backend server is unavailable";
        }
    }
}


// ======================================================
// INCIDENTS
// ======================================================

async function loadIncidents() {

    const incidents =
        await getData(
            `${API}/incidents`
        );

    const count =
        document.getElementById(
            "incident-count"
        );

    if (count) {

        count.textContent =
            incidents.length;
    }

    const container =
        document.getElementById(
            "incidents-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!Array.isArray(incidents) || incidents.length === 0) {

        container.innerHTML = `
            <div class="plan-empty">
                No active incidents.
            </div>
        `;

        return;
    }

    incidents.forEach(
        incident => {

            let severityIcon =
                "🟢";

            if (
                incident.severity ===
                "Critical"
            ) {

                severityIcon =
                    "🔴";

            } else if (
                incident.severity ===
                "High"
            ) {

                severityIcon =
                    "🟠";

            } else if (
                incident.severity ===
                "Medium"
            ) {

                severityIcon =
                    "🟡";
            }

            const resources =
                Array.isArray(
                    incident.required_resources
                )
                    ? incident.required_resources.join(", ")
                    : "Not specified";


            container.innerHTML += `

                <div class="simulation-card">

                    <h3>
                        🚨 ${escapeHTML(incident.id)}
                    </h3>

                    <p>
                        <strong>Type:</strong>
                        ${escapeHTML(incident.type)}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHTML(incident.location)}
                    </p>

                    <p>
                        <strong>Severity:</strong>
                        ${severityIcon}
                        ${escapeHTML(incident.severity)}
                    </p>

                    <p>
                        <strong>Resources:</strong>
                        ${escapeHTML(resources)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(incident.status)}
                    </p>

                </div>

            `;
        }
    );
}


// ======================================================
// RESOURCES
// ======================================================

async function loadResources() {

    const resources =
        await getData(
            `${API}/resources`
        );

    const count =
        document.getElementById(
            "resource-count"
        );

    if (count) {

        count.textContent =
            resources.length;
    }

    const container =
        document.getElementById(
            "resources-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!Array.isArray(resources) || resources.length === 0) {

        container.innerHTML = `
            <div class="plan-empty">
                No resources available.
            </div>
        `;

        return;
    }

    resources.forEach(
        resource => {

            const available =
                resource.status ===
                "available";

            const status =
                available
                    ? "🟢 Available"
                    : "🔴 Unavailable";


            container.innerHTML += `

                <div class="simulation-card">

                    <h3>
                        🚑 ${escapeHTML(resource.id)}
                    </h3>

                    <p>
                        <strong>Type:</strong>
                        ${escapeHTML(resource.type)}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHTML(resource.location)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${status}
                    </p>

                </div>

            `;
        }
    );
}


// ======================================================
// PLAN
// ======================================================

async function loadPlan() {

    try {

        const data =
            await getData(
                `${API}/plan`
            );

        const container =
            document.getElementById(
                "plan-container"
            );

        if (!container) {
            return;
        }

        const currentPlan =
            data.plan;

        if (!currentPlan) {

            container.innerHTML = `
                <div class="plan-empty">
                    No response plan available.
                </div>
            `;

            return;
        }

        const plan =
            Array.isArray(currentPlan.plan)
                ? currentPlan.plan
                : [];

        const version =
            currentPlan.version ||
            "V1";

        const status =
            currentPlan.status ||
            "Unknown";


        // --------------------------------------------------
        // PLAN STATUS CLASS
        // --------------------------------------------------

        let statusClass =
            "pending";

        if (
            status === "Active"
        ) {

            statusClass =
                "active";

        } else if (
            status === "Outdated"
        ) {

            statusClass =
                "outdated";

        } else if (
            status === "Rejected"
        ) {

            statusClass =
                "rejected";
        }


        // --------------------------------------------------
        // PLAN COUNTS
        // --------------------------------------------------

        const assignedCount =
            plan.filter(
                item =>
                    item.status ===
                    "Assigned"
            ).length;

        const attentionCount =
            plan.filter(
                item =>
                    item.status ===
                    "Human Attention Required"
            ).length;


        // --------------------------------------------------
        // SEVERITY CLASS
        // --------------------------------------------------

        function getSeverityClass(
            severity
        ) {

            if (!severity) {
                return "low";
            }

            return String(
                severity
            ).toLowerCase();
        }


        // --------------------------------------------------
        // PLAN DISPLAY
        // --------------------------------------------------

        container.innerHTML = `

            <div class="plan-summary">

                <div class="plan-summary-card">

                    <span>
                        Plan Version
                    </span>

                    <strong
                        class="plan-version"
                    >
                        ${escapeHTML(version)}
                    </strong>

                </div>


                <div class="plan-summary-card">

                    <span>
                        Plan Status
                    </span>

                    <strong
                        class="plan-status ${statusClass}"
                    >
                        ${escapeHTML(status)}
                    </strong>

                </div>


                <div class="plan-summary-card">

                    <span>
                        Assigned
                    </span>

                    <strong>
                        ${assignedCount}
                    </strong>

                </div>


                <div class="plan-summary-card">

                    <span>
                        Human Attention
                    </span>

                    <strong>
                        ${attentionCount}
                    </strong>

                </div>

            </div>


            <div class="plan-assignments">

                ${
                    plan.length === 0

                    ?

                    `
                    <div class="plan-empty">
                        No assignments available.
                    </div>
                    `

                    :

                    plan.map(
                        assignment => {

                            const isAttention =
                                assignment.status ===
                                "Human Attention Required";


                            const cardClass =
                                isAttention
                                    ? "attention"
                                    : "assigned";


                            const assignmentStatusClass =
                                isAttention
                                    ? "attention"
                                    : "assigned";


                            const statusIcon =
                                isAttention
                                    ? "⚠️"
                                    : "🟢";


                            const resource =
                                assignment.resource_id
                                || "No Resource";


                            const reason =
                                assignment.reason
                                || "No reason provided.";


                            const severity =
                                assignment.severity
                                || "Low";


                            return `

                                <div
                                    class="
                                        plan-assignment
                                        ${cardClass}
                                    "
                                >

                                    <div
                                        class="
                                            plan-assignment-header
                                        "
                                    >

                                        <div
                                            class="
                                                plan-resource
                                            "
                                        >

                                            🚑
                                            ${escapeHTML(resource)}

                                            →

                                            ${escapeHTML(
                                                assignment.incident_id
                                            )}

                                        </div>


                                        <div
                                            class="
                                                plan-assignment-status
                                                ${assignmentStatusClass}
                                            "
                                        >

                                            ${statusIcon}

                                            ${escapeHTML(
                                                assignment.status
                                            )}

                                        </div>

                                    </div>


                                    <div
                                        class="
                                            plan-incident
                                        "
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                assignment.incident_type
                                            )}
                                        </strong>

                                    </div>


                                    <div
                                        class="
                                            plan-location
                                        "
                                    >

                                        📍
                                        ${escapeHTML(
                                            assignment.location
                                        )}

                                    </div>


                                    <span
                                        class="
                                            plan-severity
                                            ${getSeverityClass(
                                                severity
                                            )}
                                        "
                                    >

                                        ${escapeHTML(
                                            severity
                                        )}

                                    </span>


                                    <div
                                        class="
                                            plan-reason
                                        "
                                    >

                                        <strong>
                                            Why:
                                        </strong>

                                        ${escapeHTML(
                                            reason
                                        )}

                                    </div>

                                </div>

                            `;
                        }
                    ).join("")
                }

            </div>

        `;

    } catch (error) {

        console.error(
            "Plan loading error:",
            error
        );

        const container =
            document.getElementById(
                "plan-container"
            );

        if (container) {

            container.innerHTML = `

                <div class="plan-empty">

                    ⚠️ Unable to load response plan.

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;
        }
    }
}


// ======================================================
// APPROVE PLAN
// ======================================================

async function approvePlan() {

    try {

        const data =
            await getData(
                `${API}/approve-plan`,
                {
                    method: "POST"
                }
            );

        alert(data.message);

        await loadAll();

    } catch (error) {

        console.error(
            "Approval error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// REJECT PLAN
// ======================================================

async function rejectPlan() {

    const confirmed =
        confirm(
            "Are you sure you want to reject the current plan?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const data =
            await getData(
                `${API}/reject-plan`,
                {
                    method: "POST"
                }
            );

        alert(data.message);

        await loadAll();

    } catch (error) {

        console.error(
            "Rejection error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// REPLAN
// ======================================================

async function replan() {

    try {

        const data =
            await getData(
                `${API}/replan`,
                {
                    method: "POST"
                }
            );

        alert(data.message);

        await loadAll();

    } catch (error) {

        console.error(
            "Re-planning error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// AI ANALYSIS
// ======================================================

async function aiAnalysis() {

    const box =
        document.getElementById(
            "ai-analysis"
        );

    if (!box) {
        return;
    }


    box.innerHTML =
        "🤖 AI is analyzing the emergency situation...";


    try {

        const data =
            await getData(
                `${API}/ai/explain-plan`
            );


        if (
            !data.ai_analysis ||
            !data.ai_analysis.summary
        ) {

            box.innerHTML =
                "No AI explanation was returned.";

            return;
        }


        box.innerHTML = `

            <strong>
                🤖 AI Situation Analysis
            </strong>

            <hr>

            <div>
                ${formatAIText(
                    data.ai_analysis.summary
                )}
            </div>

        `;

    } catch (error) {

        console.error(
            "AI error:",
            error
        );


        box.innerHTML = `

            <strong>
                ❌ AI Analysis Failed
            </strong>

            <p>
                ${escapeHTML(
                    error.message
                )}
            </p>

        `;
    }
}


// ======================================================
// FORMAT AI TEXT
// ======================================================

function formatAIText(text) {

    return escapeHTML(text)
        .replace(
            /\n/g,
            "<br>"
        );
}


// ======================================================
// NEW EMERGENCY
// ======================================================

async function newEmergency() {

    try {

        const data =
            await getData(
                `${API}/simulate/new-emergency`,
                {
                    method: "POST"
                }
            );

        alert(data.message);

        await loadAll();

    } catch (error) {

        console.error(
            "New emergency error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// RESOURCE FAILURE
// ======================================================

async function resourceFailure() {

    try {

        const data =
            await getData(
                `${API}/simulate/resource-failure`,
                {
                    method: "POST"
                }
            );

        alert(data.message);

        await loadAll();

    } catch (error) {

        console.error(
            "Resource failure error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// INCREASE SEVERITY
// ======================================================

async function increaseSeverity() {

    try {

        const data =
            await getData(
                `${API}/simulate/increase-severity`,
                {
                    method: "POST"
                }
            );

        alert(data.message);

        await loadAll();

    } catch (error) {

        console.error(
            "Severity increase error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// MONITOR
// ======================================================

async function loadMonitor() {

    const container =
        document.getElementById(
            "monitor-container"
        );

    if (!container) {
        return;
    }


    try {

        const data =
            await getData(
                `${API}/monitor`
            );


        if (!data.changes_detected) {

            container.innerHTML = `

                <strong>
                    🟢 No Changes Detected
                </strong>

                <p>
                    Emergency situation is stable.
                </p>

            `;

            return;
        }


        container.innerHTML = `

            <strong>
                ⚠️ Changes Detected
            </strong>

            <p>
                The monitoring system detected
                changes requiring attention.
            </p>

        `;


        if (
            !Array.isArray(data.changes)
        ) {

            return;
        }


        data.changes.forEach(
            change => {

                container.innerHTML += `

                    <div class="simulation-card">

                        <h3>
                            ${escapeHTML(
                                change.type
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                change.reason || ""
                            )}
                        </p>

                        <p>

                            <strong>
                                Action:
                            </strong>

                            ${escapeHTML(
                                change.action || ""
                            )}

                        </p>

                    </div>

                `;
            }
        );

    } catch (error) {

        console.error(
            "Monitor loading error:",
            error
        );

        container.innerHTML = `

            <strong>
                ⚠️ Monitor Unavailable
            </strong>

            <p>
                ${escapeHTML(
                    error.message
                )}
            </p>

        `;
    }
}


// ======================================================
// HISTORY
// ======================================================

async function loadHistory() {

    const container =
        document.getElementById(
            "history-container"
        );

    if (!container) {
        return;
    }


    try {

        const history =
            await getData(
                `${API}/plan-history`
            );


        container.innerHTML = "";


        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {

            container.innerHTML = `
                <div class="plan-empty">
                    No plan history available.
                </div>
            `;

            return;
        }


        history.forEach(
            plan => {

                container.innerHTML += `

                    <div class="simulation-card">

                        <h3>
                            📋 ${escapeHTML(
                                plan.version
                            )}
                        </h3>

                        <p>
                            <strong>Status:</strong>
                            ${escapeHTML(
                                plan.status
                            )}
                        </p>

                        <p>
                            <strong>Reason:</strong>
                            ${escapeHTML(
                                plan.change_reason
                            )}
                        </p>

                    </div>

                `;
            }
        );

    } catch (error) {

        console.error(
            "History loading error:",
            error
        );

        container.innerHTML = `

            <div class="plan-empty">

                ⚠️ Unable to load plan history.

            </div>

        `;
    }
}


// ======================================================
// AUDIT LOG
// ======================================================

async function loadAuditLog() {

    const container =
        document.getElementById(
            "audit-container"
        );

    if (!container) {
        return;
    }


    try {

        const data =
            await getData(
                `${API}/audit-log`
            );


        container.innerHTML = "";


        const logs =
            data.audit_log || [];


        if (
            !Array.isArray(logs) ||
            logs.length === 0
        ) {

            container.innerHTML = `
                <div class="plan-empty">
                    No audit events recorded.
                </div>
            `;

            return;
        }


        logs
            .slice()
            .reverse()
            .forEach(
                log => {

                    container.innerHTML += `

                        <div class="simulation-card">

                            <h3>
                                🔐 ${escapeHTML(
                                    log.action
                                )}
                            </h3>

                            <p>

                                <strong>
                                    Time:
                                </strong>

                                ${escapeHTML(
                                    log.timestamp
                                )}

                            </p>

                            <p>
                                ${escapeHTML(
                                    log.details
                                )}
                            </p>

                        </div>

                    `;
                }
            );

    } catch (error) {

        console.error(
            "Audit log loading error:",
            error
        );

        container.innerHTML = `

            <div class="plan-empty">

                ⚠️ Unable to load audit log.

            </div>

        `;
    }
}


// ======================================================
// MULTI-AGENT STATUS
// ======================================================

async function loadAgents() {

    try {

        const data =
            await getData(
                `${API}/agents/status`
            );


        const currentPlan =
            await getData(
                `${API}/plan`
            );


        const container =
            document.getElementById(
                "agents-container"
            );


        const details =
            document.getElementById(
                "agent-details"
            );


        if (!container) {

            console.warn(
                "agents-container not found."
            );

            return;
        }


        container.innerHTML = "";


        // ==================================================
        // AGENT INFORMATION
        // ==================================================

        const agentInfo = {

            "Assessment Agent": {

                icon: "🧠",

                step: "1",

                title: "Assess",

                description:
                    "Analyzes emergency incidents and identifies their requirements."
            },


            "Planning Agent": {

                icon: "📋",

                step: "2",

                title: "Allocate",

                description:
                    "Allocates available resources according to incident priority."
            },


            "Security/SISO Agent": {

                icon: "🔐",

                step: "3",

                title: "Validate",

                description:
                    "Validates incidents, resources and the response plan."
            },


            "Monitoring Agent": {

                icon: "👁️",

                step: "4",

                title: "Monitor",

                description:
                    "Continuously checks for changes in the emergency situation."
            },


            "Re-planning Agent": {

                icon: "🔄",

                step: "5",

                title: "Re-plan",

                description:
                    "Generates a new response plan when a significant change occurs."
            }

        };


        // ==================================================
        // STATUS CLASS
        // ==================================================

        function getStatusClass(
            status
        ) {

            if (
                status === "Passed" ||
                status === "Completed"
            ) {

                return "agent-success";
            }


            if (
                status === "Warning" ||
                status === "Change Detected"
            ) {

                return "agent-warning";
            }


            if (
                status === "Triggered"
            ) {

                return "agent-triggered";
            }


            if (
                status === "Monitoring"
            ) {

                return "agent-monitoring";
            }


            return "agent-normal";
        }


        // ==================================================
        // WORKFLOW CONNECTOR
        // ==================================================

        function addConnector() {

            const connector =
                document.createElement(
                    "div"
                );


            connector.className =
                "agent-connector";


            connector.innerHTML = `
                <span>↓</span>
            `;


            container.appendChild(
                connector
            );
        }


        // ==================================================
        // CREATE AGENT CARD
        // ==================================================

        function createAgentCard(
            agent,
            index
        ) {

            const info =
                agentInfo[
                    agent.agent
                ] || {

                    icon: "🤖",

                    step:
                        String(
                            index + 1
                        ),

                    title: "Process",

                    description:
                        "Emergency response agent."
                };


            const statusClass =
                getStatusClass(
                    agent.status
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `agent-card ${statusClass}`;


            card.innerHTML = `

                <div class="agent-step">
                    ${escapeHTML(info.step)}
                </div>


                <div class="agent-icon">
                    ${info.icon}
                </div>


                <div class="agent-info">

                    <div class="agent-title">
                        ${escapeHTML(info.title)}
                    </div>


                    <h3>
                        ${escapeHTML(agent.agent)}
                    </h3>


                    <p class="agent-description">
                        ${escapeHTML(
                            info.description
                        )}
                    </p>


                    <span class="agent-status">
                        ${escapeHTML(agent.status)}
                    </span>

                </div>

            `;


            container.appendChild(
                card
            );
        }


        // ==================================================
        // CREATE WORKFLOW
        // ==================================================

        if (
            Array.isArray(data.agents)
        ) {

            data.agents.forEach(
                (agent, index) => {

                    createAgentCard(
                        agent,
                        index
                    );


                    // ------------------------------------------
                    // HUMAN APPROVAL AFTER SECURITY
                    // ------------------------------------------

                    if (
                        agent.agent ===
                        "Security/SISO Agent"
                    ) {

                        addConnector();


                        const humanStage =
                            document.createElement(
                                "div"
                            );


                        humanStage.className =
                            "human-approval-stage";


                        const planStatus =
                            currentPlan.status;


                        let approvalIcon =
                            "👤";


                        let approvalStatus =
                            "Pending Human Approval";


                        let approvalClass =
                            "pending";


                        if (
                            planStatus ===
                            "Active"
                        ) {

                            approvalIcon =
                                "✅";

                            approvalStatus =
                                "Plan Active";

                            approvalClass =
                                "active";

                        } else if (
                            planStatus ===
                            "Rejected"
                        ) {

                            approvalIcon =
                                "❌";

                            approvalStatus =
                                "Plan Rejected";

                            approvalClass =
                                "rejected";

                        } else if (
                            planStatus ===
                            "Outdated"
                        ) {

                            approvalIcon =
                                "⚠️";

                            approvalStatus =
                                "Plan Outdated";

                            approvalClass =
                                "outdated";
                        }


                        humanStage.innerHTML = `

                            <div
                                class="
                                    human-approval-icon
                                    ${approvalClass}
                                "
                            >
                                ${approvalIcon}
                            </div>


                            <div
                                class="
                                    human-approval-content
                                "
                            >

                                <div
                                    class="
                                        human-stage-title
                                    "
                                >
                                    👤 Human Approval
                                </div>


                                <p>
                                    Human review is required
                                    before activating a response plan.
                                </p>


                                <div
                                    class="
                                        human-approval-plan
                                    "
                                >

                                    <span>
                                        Current Plan
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            currentPlan.version
                                        )}
                                    </strong>

                                </div>


                                <div
                                    class="
                                        human-approval-plan
                                    "
                                >

                                    <span>
                                        Plan Status
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            planStatus
                                        )}
                                    </strong>

                                </div>


                                <span
                                    class="
                                        human-approval-status
                                        ${approvalClass}
                                    "
                                >
                                    ${approvalStatus}
                                </span>

                            </div>

                        `;


                        container.appendChild(
                            humanStage
                        );


                        addConnector();

                        return;
                    }


                    // ------------------------------------------
                    // NORMAL AGENT CONNECTOR
                    // ------------------------------------------

                    if (
                        index <
                        data.agents.length - 1
                    ) {

                        addConnector();
                    }

                }
            );
        }


        // ==================================================
        // AGENT DETAILS
        // ==================================================

        if (details) {

            let html = `

                <div class="agent-details-title">

                    🤖 Multi-Agent Activity

                </div>


                <p class="agent-details-subtitle">

                    Current status of the emergency
                    response workflow.

                </p>

            `;


            if (
                Array.isArray(data.agents)
            ) {

                data.agents.forEach(
                    agent => {

                        const info =
                            agentInfo[
                                agent.agent
                            ] || {};


                        html += `

                            <div
                                class="
                                    agent-detail-row
                                "
                            >

                                <div>

                                    <strong>

                                        ${
                                            info.icon ||
                                            "🤖"
                                        }

                                        ${escapeHTML(
                                            agent.agent
                                        )}

                                    </strong>


                                    <br>


                                    <span>

                                        ${
                                            escapeHTML(
                                                info.description ||
                                                ""
                                            )
                                        }

                                    </span>

                                </div>


                                <strong>

                                    ${escapeHTML(
                                        agent.status
                                    )}

                                </strong>

                            </div>

                        `;
                    }
                );
            }


            // ----------------------------------------------
            // HUMAN APPROVAL DETAILS
            // ----------------------------------------------

            html += `

                <div
                    class="
                        agent-detail-row
                        human-detail-row
                    "
                >

                    <div>

                        <strong>
                            👤 Human Approval
                        </strong>

                        <br>

                        <span>
                            Human review is required
                            before activating a response plan.
                        </span>

                    </div>


                    <strong>
                        ${escapeHTML(
                            currentPlan.status
                        )}
                    </strong>

                </div>

            `;


            details.innerHTML =
                html;
        }


    } catch (error) {

        console.error(
            "Failed to load agents:",
            error
        );


        const details =
            document.getElementById(
                "agent-details"
            );


        if (details) {

            details.innerHTML = `

                <strong>
                    ⚠️ Multi-Agent Error
                </strong>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            `;
        }
    }
}


// ======================================================
// RESET
// ======================================================

async function resetSimulation() {

    const confirmed =
        confirm(
            "Reset the complete simulation?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await getData(
                `${API}/reset`,
                {
                    method: "POST"
                }
            );


        alert(data.message);


        await loadAll();

    } catch (error) {

        console.error(
            "Reset error:",
            error
        );

        alert(error.message);
    }
}


// ======================================================
// LOAD ALL
// ======================================================

async function loadAll() {

    // Prevent two complete dashboard refreshes
    // from running at exactly the same time.
    if (dashboardLoading) {
        return;
    }

    dashboardLoading = true;

    try {

        await checkSystemStatus();

        await Promise.allSettled([

            loadIncidents(),

            loadResources(),

            loadPlan(),

            loadHistory(),

            loadMonitor(),

            loadAuditLog(),

            loadAgents()

        ]);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        const statusText =
            document.getElementById(
                "system-status-text"
            );


        const statusDot =
            document.getElementById(
                "system-status-dot"
            );


        if (statusText) {

            statusText.textContent =
                "System Offline";
        }


        if (statusDot) {

            statusDot.className =
                "status-dot offline";
        }

    } finally {

        dashboardLoading = false;
    }
}


// ======================================================
// CONNECT BUTTONS
// ======================================================

function connectButtons() {

    const approveButton =
        document.getElementById(
            "approve-plan"
        );


    const rejectButton =
        document.getElementById(
            "reject-plan"
        );


    const replanButton =
        document.getElementById(
            "replan"
        );


    const aiButton =
        document.getElementById(
            "ai-analysis-btn"
        );


    const newEmergencyButton =
        document.getElementById(
            "new-emergency"
        );


    const resourceFailureButton =
        document.getElementById(
            "resource-failure"
        );


    const severityButton =
        document.getElementById(
            "increase-severity"
        );


    const resetButton =
        document.getElementById(
            "reset-simulation"
        );


    // --------------------------------------------------
    // Remove previous listeners by cloning buttons.
    // This prevents duplicate actions if initialization
    // happens more than once.
    // --------------------------------------------------

    function connect(
        button,
        handler
    ) {

        if (!button) {
            return;
        }


        const newButton =
            button.cloneNode(true);


        button.replaceWith(
            newButton
        );


        newButton.addEventListener(
            "click",
            handler
        );
    }


    connect(
        approveButton,
        approvePlan
    );


    connect(
        rejectButton,
        rejectPlan
    );


    connect(
        replanButton,
        replan
    );


    connect(
        aiButton,
        aiAnalysis
    );


    connect(
        newEmergencyButton,
        newEmergency
    );


    connect(
        resourceFailureButton,
        resourceFailure
    );


    connect(
        severityButton,
        increaseSeverity
    );


    connect(
        resetButton,
        resetSimulation
    );


    console.log(
        "All dashboard buttons connected."
    );
}


// ======================================================
// AUTOMATIC REFRESH
// ======================================================

function startAutoRefresh() {

    // Stop an existing timer first.
    if (refreshTimer !== null) {

        clearInterval(
            refreshTimer
        );
    }


    refreshTimer =
        setInterval(
            async function () {

                try {

                    await loadAll();

                    console.log(
                        "Dashboard automatically refreshed."
                    );

                } catch (error) {

                    console.error(
                        "Automatic refresh failed:",
                        error
                    );
                }

            },
            15000
        );
}


// ======================================================
// START APPLICATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "AapatSetu AI dashboard started."
        );


        connectButtons();


        await loadAll();


        startAutoRefresh();


        console.log(
            "Dashboard data loaded."
        );

    }
);