const API = "https://aapatsetu-ai.onrender.com";

let refreshTimer = null;
let dashboardLoading = false;


// ============================================================
// API HELPER
// ============================================================

async function getData(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `HTTP ${response.status}`;

        try {
            const errorData = await response.json();
            message =
                errorData.detail ||
                errorData.message ||
                message;
        } catch (error) {
            // Response was not JSON
        }

        throw new Error(message);
    }

    return await response.json();
}


// ============================================================
// HTML SAFETY
// ============================================================

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


// ============================================================
// SYSTEM STATUS
// ============================================================

async function checkSystemStatus() {
    const statusText = document.getElementById("system-status-text");
    const statusDot = document.getElementById("system-status-dot");

    if (!statusText || !statusDot) {
        return;
    }

    try {
        const data = await getData(API);

        if (data && data.status === "running") {
            statusText.textContent = "System Online";
            statusDot.className = "status-dot online";
        } else {
            statusText.textContent = "System Warning";
            statusDot.className = "status-dot warning";
        }
    } catch (error) {
        console.error("System status error:", error);

        statusText.textContent = "System Offline";
        statusDot.className = "status-dot offline";
    }
}


// ============================================================
// INCIDENTS
// ============================================================

async function loadIncidents() {
    const container = document.getElementById("incidents-container");
    const count = document.getElementById("incident-count");

    if (!container) {
        return;
    }

    try {
        const incidents = await getData(`${API}/incidents`);

        if (count) {
            count.textContent = Array.isArray(incidents)
                ? incidents.length
                : 0;
        }

        if (!Array.isArray(incidents) || incidents.length === 0) {
            container.innerHTML = `
                <div class="plan-empty">
                    No active incidents.
                </div>
            `;
            return;
        }

        container.innerHTML = "";

        incidents.forEach((incident) => {
            let severityIcon = "🟢";

            if (incident.severity === "Critical") {
                severityIcon = "🔴";
            } else if (incident.severity === "High") {
                severityIcon = "🟠";
            } else if (incident.severity === "Medium") {
                severityIcon = "🟡";
            }

            const requiredResources =
                Array.isArray(incident.required_resources)
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
                        <strong>Required Resources:</strong>
                        ${escapeHTML(requiredResources)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(incident.status)}
                    </p>
                </div>
            `;
        });
    } catch (error) {
        console.error("Incident loading error:", error);

        container.innerHTML = `
            <div class="plan-empty">
                ⚠️ Unable to load incidents.
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}


// ============================================================
// RESOURCES
// ============================================================

async function loadResources() {
    const container = document.getElementById("resources-container");
    const count = document.getElementById("resource-count");

    if (!container) {
        return;
    }

    try {
        const resources = await getData(`${API}/resources`);

        if (count) {
            count.textContent = Array.isArray(resources)
                ? resources.length
                : 0;
        }

        if (!Array.isArray(resources) || resources.length === 0) {
            container.innerHTML = `
                <div class="plan-empty">
                    No resources available.
                </div>
            `;
            return;
        }

        container.innerHTML = "";

        resources.forEach((resource) => {
            const status =
                resource.status === "available"
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
        });
    } catch (error) {
        console.error("Resource loading error:", error);

        container.innerHTML = `
            <div class="plan-empty">
                ⚠️ Unable to load resources.
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}


// ============================================================
// PLAN
// ============================================================

async function loadPlan() {
    const container = document.getElementById("plan-container");
    const versionElement = document.getElementById("plan-version");
    const statusElement = document.getElementById("plan-status");

    if (!container) {
        return;
    }

    try {
        const currentPlan = await getData(`${API}/plan`);

        if (!currentPlan) {
            container.innerHTML = `
                <div class="plan-empty">
                    No response plan available.
                </div>
            `;
            return;
        }

        const plan = Array.isArray(currentPlan.plan)
            ? currentPlan.plan
            : [];

        const version = currentPlan.version || "V1";
        const status = currentPlan.status || "Unknown";

        if (versionElement) {
            versionElement.textContent = version;
        }

        if (statusElement) {
            statusElement.textContent = status;
        }

        const assignedCount = plan.filter(
            (item) => item.status === "Assigned"
        ).length;

        const attentionCount = plan.filter(
            (item) => item.status === "Human Attention Required"
        ).length;

        let planStatusClass = "pending";

        if (status === "Active") {
            planStatusClass = "active";
        } else if (status === "Outdated") {
            planStatusClass = "outdated";
        } else if (status === "Rejected") {
            planStatusClass = "rejected";
        }

        let assignmentsHTML = "";

        if (plan.length === 0) {
            assignmentsHTML = `
                <div class="plan-empty">
                    No assignments available.
                </div>
            `;
        } else {
            assignmentsHTML = plan.map((assignment) => {
                const isAttention =
                    assignment.status === "Human Attention Required";

                const cardClass =
                    isAttention ? "attention" : "assigned";

                const statusClass =
                    isAttention ? "attention" : "assigned";

                const icon =
                    isAttention ? "⚠️" : "🟢";

                const resource =
                    assignment.resource_id || "No Resource";

                const reason =
                    assignment.reason || "No reason provided.";

                return `
                    <div class="plan-assignment ${cardClass}">

                        <div class="plan-assignment-header">

                            <div class="plan-resource">
                                🚑
                                ${escapeHTML(resource)}
                                →
                                ${escapeHTML(assignment.incident_id)}
                            </div>

                            <div class="plan-assignment-status ${statusClass}">
                                ${icon}
                                ${escapeHTML(assignment.status)}
                            </div>

                        </div>

                        <div class="plan-incident">
                            <strong>
                                ${escapeHTML(assignment.incident_type)}
                            </strong>
                        </div>

                        <div class="plan-location">
                            📍
                            ${escapeHTML(assignment.location)}
                        </div>

                        <div class="plan-reason">
                            <strong>Why:</strong>
                            ${escapeHTML(reason)}
                        </div>

                    </div>
                `;
            }).join("");
        }

        container.innerHTML = `
            <div class="plan-summary">

                <div class="plan-summary-card">
                    <span>Plan Version</span>
                    <strong class="plan-version">
                        ${escapeHTML(version)}
                    </strong>
                </div>

                <div class="plan-summary-card">
                    <span>Plan Status</span>
                    <strong class="plan-status ${planStatusClass}">
                        ${escapeHTML(status)}
                    </strong>
                </div>

                <div class="plan-summary-card">
                    <span>Assigned</span>
                    <strong>
                        ${assignedCount}
                    </strong>
                </div>

                <div class="plan-summary-card">
                    <span>Human Attention</span>
                    <strong>
                        ${attentionCount}
                    </strong>
                </div>

            </div>

            <div class="plan-assignments">
                ${assignmentsHTML}
            </div>
        `;
    } catch (error) {
        console.error("Plan loading error:", error);

        container.innerHTML = `
            <div class="plan-empty">
                ⚠️ Unable to load response plan.
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}


// ============================================================
// APPROVE PLAN
// ============================================================

async function approvePlan() {
    try {
        const data = await getData(`${API}/approve-plan`, {
            method: "POST"
        });

        alert(data.message || "Plan approved successfully.");

        await loadAll();
    } catch (error) {
        console.error("Approval error:", error);
        alert(error.message);
    }
}


// ============================================================
// REJECT PLAN
// ============================================================

async function rejectPlan() {
    const confirmed = confirm(
        "Are you sure you want to reject the current plan?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const data = await getData(`${API}/reject-plan`, {
            method: "POST"
        });

        alert(data.message || "Plan rejected.");

        await loadAll();
    } catch (error) {
        console.error("Rejection error:", error);
        alert(error.message);
    }
}


// ============================================================
// REPLAN
// ============================================================

async function replan() {
    try {
        const data = await getData(`${API}/replan`, {
            method: "POST"
        });

        alert(data.message || "New plan generated.");

        await loadAll();
    } catch (error) {
        console.error("Re-planning error:", error);
        alert(error.message);
    }
}


// ============================================================
// AI ANALYSIS
// ============================================================

async function aiAnalysis() {
    const box = document.getElementById("ai-analysis");

    if (!box) {
        return;
    }

    box.innerHTML =
        "🤖 AI is analyzing the emergency situation...";

    try {
        const data = await getData(
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
        console.error("AI analysis error:", error);

        box.innerHTML = `
            <strong>
                ❌ AI Analysis Failed
            </strong>

            <p>
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}


// ============================================================
// AI TEXT FORMAT
// ============================================================

function formatAIText(text) {
    return escapeHTML(text).replace(/\n/g, "<br>");
}


// ============================================================
// NEW EMERGENCY
// ============================================================

async function newEmergency() {
    try {
        const data = await getData(
            `${API}/simulate/new-emergency`,
            {
                method: "POST"
            }
        );

        alert(data.message || "New emergency simulated.");

        await loadAll();
    } catch (error) {
        console.error("New emergency error:", error);
        alert(error.message);
    }
}


// ============================================================
// RESOURCE FAILURE
// ============================================================

async function resourceFailure() {
    try {
        const data = await getData(
            `${API}/simulate/resource-failure`,
            {
                method: "POST"
            }
        );

        alert(data.message || "Resource failure simulated.");

        await loadAll();
    } catch (error) {
        console.error("Resource failure error:", error);
        alert(error.message);
    }
}


// ============================================================
// INCREASE SEVERITY
// ============================================================

async function increaseSeverity() {
    try {
        const data = await getData(
            `${API}/simulate/increase-severity`,
            {
                method: "POST"
            }
        );

        alert(
            data.message ||
            "Incident severity increased."
        );

        await loadAll();
    } catch (error) {
        console.error(
            "Severity increase error:",
            error
        );

        alert(error.message);
    }
}


// ============================================================
// MONITOR
// ============================================================

async function loadMonitor() {
    const container =
        document.getElementById("monitor-container");

    if (!container) {
        return;
    }

    try {
        const data = await getData(`${API}/monitor`);

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

        if (!Array.isArray(data.changes)) {
            return;
        }

        data.changes.forEach((change) => {
            container.innerHTML += `
                <div class="simulation-card">

                    <h3>
                        ${escapeHTML(change.type)}
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
        });
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
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}


// ============================================================
// PLAN HISTORY
// ============================================================

async function loadHistory() {
    const container =
        document.getElementById("history-container");

    if (!container) {
        return;
    }

    try {
        const history =
            await getData(`${API}/plan-history`);

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

        container.innerHTML = "";

        history.forEach((plan) => {
            container.innerHTML += `
                <div class="simulation-card">

                    <h3>
                        📋 ${escapeHTML(plan.version)}
                    </h3>

                    <p>
                        <strong>
                            Status:
                        </strong>

                        ${escapeHTML(plan.status)}
                    </p>

                    <p>
                        <strong>
                            Reason:
                        </strong>

                        ${escapeHTML(
                            plan.change_reason || ""
                        )}
                    </p>

                </div>
            `;
        });
    } catch (error) {
        console.error(
            "History loading error:",
            error
        );

        container.innerHTML = `
            <div class="plan-empty">
                ⚠️ Unable to load plan history.

                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


// ============================================================
// AUDIT LOG
// ============================================================

async function loadAuditLog() {
    const container =
        document.getElementById("audit-container");

    if (!container) {
        return;
    }

    try {
        const data =
            await getData(`${API}/audit-log`);

        const logs =
            Array.isArray(data.audit_log)
                ? data.audit_log
                : [];

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="plan-empty">
                    No audit events recorded.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        logs.slice().reverse().forEach((log) => {
            container.innerHTML += `
                <div class="simulation-card">

                    <h3>
                        🔐 ${escapeHTML(
                            log.action || "Audit Event"
                        )}
                    </h3>

                    <p>
                        <strong>
                            Time:
                        </strong>

                        ${escapeHTML(
                            log.timestamp || ""
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            log.details || ""
                        )}
                    </p>

                </div>
            `;
        });
    } catch (error) {
        console.error(
            "Audit log loading error:",
            error
        );

        container.innerHTML = `
            <div class="plan-empty">
                ⚠️ Unable to load audit log.

                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


// ============================================================
// MULTI-AGENT STATUS
// ============================================================

async function loadAgents() {
    const container =
        document.getElementById("agents-container");

    const details =
        document.getElementById("agent-details");

    if (!container) {
        return;
    }

    try {
        const data =
            await getData(`${API}/agents/status`);

        container.innerHTML = "";

        const agentInfo = {
            "Assessment Agent": {
                icon: "🧠",
                title: "Assess"
            },

            "Planning Agent": {
                icon: "📋",
                title: "Allocate"
            },

            "Security/SISO Agent": {
                icon: "🔐",
                title: "Validate"
            },

            "Human Review": {
                icon: "👤",
                title: "Human Review"
            },

            "Monitoring Agent": {
                icon: "👁️",
                title: "Monitor"
            },

            "Re-planning Agent": {
                icon: "🔄",
                title: "Re-plan"
            },

            "Command Coordinator": {
                icon: "🎯",
                title: "Coordinate"
            }
        };


        function getAgentStatusClass(status) {
            if (
                status === "Passed" ||
                status === "Completed" ||
                status === "Approved" ||
                status === "Plan Active"
            ) {
                return "agent-success";
            }

            if (
                status === "Warning" ||
                status === "Change Detected" ||
                status === "Plan Outdated" ||
                status === "Waiting for Human Approval" ||
                status === "Rejected" ||
                status === "Security Warning"
            ) {
                return "agent-warning";
            }

            if (
                status === "Triggered" ||
                status === "Re-planning Required"
            ) {
                return "agent-triggered";
            }

            if (status === "Monitoring") {
                return "agent-monitoring";
            }

            return "agent-normal";
        }


        function createAgentCard(agent, index) {
            const info =
                agentInfo[agent.agent] || {
                    icon: "🤖",
                    title: "Process"
                };

            const card =
                document.createElement("div");

            card.className =
                `agent-card ${getAgentStatusClass(
                    agent.status
                )}`;

            card.innerHTML = `
                <div class="agent-step">
                    ${index + 1}
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
                            agent.role || ""
                        )}
                    </p>

                    <span class="agent-status">
                        ${escapeHTML(agent.status)}
                    </span>

                </div>
            `;

            container.appendChild(card);
        }


        function createConnector() {
            const connector =
                document.createElement("div");

            connector.className =
                "agent-connector";

            connector.innerHTML = "<span>↓</span>";

            container.appendChild(connector);
        }


        if (Array.isArray(data.agents)) {
            data.agents.forEach((agent, index) => {

                createAgentCard(
                    agent,
                    index
                );

                if (
                    index <
                    data.agents.length - 1
                ) {
                    createConnector();
                }
            });
        }


        const summary =
            document.createElement("div");

        summary.className =
            "simulation-card";

        const workflow =
            Array.isArray(data.workflow)
                ? data.workflow.join(" → ")
                : "Not available";

        summary.innerHTML = `
            <h3>
                🎯 Command Coordinator
            </h3>

            <p>
                <strong>
                    Workflow Status:
                </strong>

                ${escapeHTML(
                    data.workflow_status ||
                    "Unknown"
                )}
            </p>

            <p>
                <strong>
                    Plan Version:
                </strong>

                ${escapeHTML(
                    data.plan_version ||
                    "Unknown"
                )}
            </p>

            <p>
                <strong>
                    Plan Status:
                </strong>

                ${escapeHTML(
                    data.plan_status ||
                    "Unknown"
                )}
            </p>

            <p>
                <strong>
                    Workflow:
                </strong>

                ${escapeHTML(workflow)}
            </p>
        `;

        container.appendChild(summary);


        if (details) {
            let detailsHTML = `
                <div class="agent-details-title">
                    🤖 Multi-Agent Activity
                </div>

                <p class="agent-details-subtitle">
                    Current status of the emergency
                    response coordination workflow.
                </p>
            `;

            if (Array.isArray(data.agents)) {
                data.agents.forEach((agent) => {
                    const info =
                        agentInfo[agent.agent] || {};

                    detailsHTML += `
                        <div class="agent-detail-row">

                            <div>
                                <strong>
                                    ${info.icon || "🤖"}
                                    ${escapeHTML(
                                        agent.agent
                                    )}
                                </strong>

                                <br>

                                <span>
                                    ${escapeHTML(
                                        agent.role || ""
                                    )}
                                </span>
                            </div>

                            <strong>
                                ${escapeHTML(
                                    agent.status
                                )}
                            </strong>

                        </div>
                    `;
                });
            }

            if (Array.isArray(data.workflow)) {
                detailsHTML += `
                    <div class="agent-detail-row">

                        <div>
                            <strong>
                                🔄 Workflow
                            </strong>

                            <br>

                            <span>
                                ${escapeHTML(
                                    data.workflow.join(
                                        " → "
                                    )
                                )}
                            </span>
                        </div>

                    </div>
                `;
            }

            details.innerHTML = detailsHTML;
        }
    } catch (error) {
        console.error(
            "Agent loading error:",
            error
        );

        if (details) {
            details.innerHTML = `
                <strong>
                    ⚠️ Multi-Agent Error
                </strong>

                <p>
                    ${escapeHTML(error.message)}
                </p>
            `;
        }
    }
}


// ============================================================
// RESET SIMULATION
// ============================================================

async function resetSimulation() {
    const confirmed = confirm(
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

        alert(
            data.message ||
            "Simulation reset successfully."
        );

        await loadAll();
    } catch (error) {
        console.error(
            "Reset error:",
            error
        );

        alert(error.message);
    }
}


// ============================================================
// LOAD ALL DATA
// ============================================================

async function loadAll() {
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
    } finally {
        dashboardLoading = false;
    }
}


// ============================================================
// CONNECT BUTTONS
// ============================================================

function connectButtons() {
    const buttonHandlers = {
        "approve-plan": approvePlan,
        "reject-plan": rejectPlan,
        "replan": replan,
        "ai-analysis-btn": aiAnalysis,
        "new-emergency": newEmergency,
        "resource-failure": resourceFailure,
        "increase-severity": increaseSeverity,
        "reset-simulation": resetSimulation
    };

    Object.entries(buttonHandlers).forEach(
        ([id, handler]) => {
            const button =
                document.getElementById(id);

            if (!button) {
                return;
            }

            button.onclick = handler;
        }
    );

    console.log(
        "Dashboard buttons connected."
    );
}


// ============================================================
// AUTO REFRESH
// ============================================================

function startAutoRefresh() {
    if (refreshTimer !== null) {
        clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(
        async () => {
            await loadAll();
        },
        15000
    );
}


// ============================================================
// START DASHBOARD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "AapatSetu AI dashboard started."
        );

        connectButtons();

        await loadAll();

        startAutoRefresh();

        console.log(
            "Dashboard loaded successfully."
        );
    }
);