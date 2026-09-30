const API = "https://aapatsetu-ai.onrender.com";


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

            statusDot.textContent =
                "";

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


            container.innerHTML += `

                <div class="simulation-card">

                    <h3>
                        🚨 ${incident.id}
                    </h3>

                    <p>
                        <strong>Type:</strong>
                        ${incident.type}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${incident.location}
                    </p>

                    <p>
                        <strong>Severity:</strong>
                        ${severityIcon}
                        ${incident.severity}
                    </p>

                    <p>
                        <strong>Resources:</strong>
                        ${
                            Array.isArray(
                                incident.required_resources
                            )
                                ? incident.required_resources.join(
                                    ", "
                                )
                                : "Not specified"
                        }
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${incident.status}
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
                        🚑 ${resource.id}
                    </h3>

                    <p>
                        <strong>Type:</strong>
                        ${resource.type}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${resource.location}
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

    const plan =
        await getData(
            `${API}/plan`
        );

    const version =
        document.getElementById(
            "plan-version"
        );

    const status =
        document.getElementById(
            "plan-status"
        );

    const container =
        document.getElementById(
            "plan-container"
        );


    if (version) {

        version.textContent =
            plan.version;
    }


    if (status) {

        status.textContent =
            plan.status;
    }


    if (!container) {
        return plan;
    }


    container.innerHTML = `

        <div class="info-box">

            <strong>
                📋 ${plan.version}
            </strong>

            <br><br>

            <strong>
                Status:
            </strong>

            ${plan.status}

            <br><br>

            <strong>
                Reason:
            </strong>

            ${plan.change_reason ||
                "No reason provided"}

        </div>

    `;


    if (
        !Array.isArray(plan.plan)
    ) {

        return plan;
    }


    plan.plan.forEach(
        item => {

            const resource =
                item.resource_id ||
                "⚠️ No Resource";


            const assignmentStatus =
                item.status ===
                "Assigned"
                    ? "🟢 Assigned"
                    : "⚠️ Human Attention Required";


            container.innerHTML += `

                <div class="simulation-card">

                    <h3>
                        ${resource}
                    </h3>

                    <p>
                        <strong>Incident:</strong>
                        ${item.incident_id}
                    </p>

                    <p>
                        <strong>Type:</strong>
                        ${item.incident_type}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${item.location}
                    </p>

                    <p>
                        <strong>Severity:</strong>
                        ${item.severity}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${assignmentStatus}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${item.reason}
                    </p>

                </div>

            `;
        }
    );


    return plan;
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
                ${error.message}
            </p>

        `;
    }
}


// ======================================================
// FORMAT AI TEXT
// ======================================================

function formatAIText(text) {

    return String(text)
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

    const data =
        await getData(
            `${API}/monitor`
        );


    const container =
        document.getElementById(
            "monitor-container"
        );


    if (!container) {
        return;
    }


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
                        ${change.type}
                    </h3>

                    <p>
                        ${change.reason || ""}
                    </p>

                    <p>

                        <strong>
                            Action:
                        </strong>

                        ${change.action || ""}

                    </p>

                </div>

            `;
        }
    );
}


// ======================================================
// HISTORY
// ======================================================

async function loadHistory() {

    const history =
        await getData(
            `${API}/plan-history`
        );


    const container =
        document.getElementById(
            "history-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(history)
    ) {

        return;
    }


    history.forEach(
        plan => {

            container.innerHTML += `

                <div class="simulation-card">

                    <h3>
                        📋 ${plan.version}
                    </h3>

                    <p>
                        <strong>Status:</strong>
                        ${plan.status}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${plan.change_reason}
                    </p>

                </div>

            `;
        }
    );
}


// ======================================================
// AUDIT LOG
// ======================================================

async function loadAuditLog() {

    const data =
        await getData(
            `${API}/audit-log`
        );


    const container =
        document.getElementById(
            "audit-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const logs =
        data.audit_log || [];


    logs
        .slice()
        .reverse()
        .forEach(
            log => {

                container.innerHTML += `

                    <div class="simulation-card">

                        <h3>
                            🔐 ${log.action}
                        </h3>

                        <p>

                            <strong>
                                Time:
                            </strong>

                            ${log.timestamp}

                        </p>

                        <p>
                            ${log.details}
                        </p>

                    </div>

                `;
            }
        );
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

                description:
                    "Analyzes emergency incidents and identifies their requirements."
            },


            "Planning Agent": {

                icon: "📋",

                step: "2",

                description:
                    "Allocates available resources according to incident priority."
            },


            "Security/SISO Agent": {

                icon: "🔐",

                step: "3",

                description:
                    "Validates incidents, resources and the response plan."
            },


            "Monitoring Agent": {

                icon: "👁️",

                step: "4",

                description:
                    "Continuously checks for changes in the emergency situation."
            },


            "Re-planning Agent": {

                icon: "🔄",

                step: "5",

                description:
                    "Generates a new response plan when a significant change occurs."
            }

        };


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


            connector.innerHTML =
                "↓";


            container.appendChild(
                connector
            );
        }


        // ==================================================
        // CREATE AGENT CARD
        // ==================================================

        function createAgentCard(agent) {

            const info =
                agentInfo[
                    agent.agent
                ] || {

                    icon: "🤖",

                    step: "",

                    description:
                        "Emergency response agent."
                };


            let statusClass =
                "agent-normal";


            if (
                agent.status === "Passed" ||
                agent.status === "Completed"
            ) {

                statusClass =
                    "agent-success";

            } else if (
                agent.status === "Warning" ||
                agent.status === "Change Detected"
            ) {

                statusClass =
                    "agent-warning";

            } else if (
                agent.status === "Triggered"
            ) {

                statusClass =
                    "agent-triggered";

            } else if (
                agent.status === "Monitoring"
            ) {

                statusClass =
                    "agent-monitoring";
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `agent-card ${statusClass}`;


            card.innerHTML = `

                <div class="agent-step">
                    ${info.step}
                </div>

                <div class="agent-icon">
                    ${info.icon}
                </div>

                <div class="agent-info">

                    <h3>
                        ${agent.agent}
                    </h3>

                    <p class="agent-description">
                        ${info.description}
                    </p>

                    <span class="agent-status">
                        ${agent.status}
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

        data.agents.forEach(
            (agent, index) => {

                createAgentCard(
                    agent
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
                        "Human-in-the-Loop";


                    if (
                        planStatus ===
                        "Pending Approval"
                    ) {

                        approvalIcon =
                            "👤";

                        approvalStatus =
                            "Pending Human Approval";

                    } else if (
                        planStatus ===
                        "Active"
                    ) {

                        approvalIcon =
                            "✅";

                        approvalStatus =
                            "Plan Active";

                    } else if (
                        planStatus ===
                        "Rejected"
                    ) {

                        approvalIcon =
                            "❌";

                        approvalStatus =
                            "Plan Rejected";

                    } else if (
                        planStatus ===
                        "Outdated"
                    ) {

                        approvalIcon =
                            "⚠️";

                        approvalStatus =
                            "Plan Outdated";
                    }


                    humanStage.innerHTML = `

                        <div class="human-approval-icon">
                            ${approvalIcon}
                        </div>

                        <div class="human-approval-content">

                            <strong>
                                Human Approval
                            </strong>

                            <p>
                                The response plan must
                                be reviewed by a human
                                before activation.
                            </p>

                            <div class="human-approval-plan">

                                <span>
                                    Current Plan
                                </span>

                                <strong>
                                    ${currentPlan.version}
                                </strong>

                            </div>

                            <div class="human-approval-plan">

                                <span>
                                    Plan Status
                                </span>

                                <strong>
                                    ${planStatus}
                                </strong>

                            </div>

                            <span class="human-approval-status">
                                ${approvalStatus}
                            </span>

                        </div>

                    `;


                    container.appendChild(
                        humanStage
                    );


                    if (
                        index <
                        data.agents.length - 1
                    ) {

                        addConnector();
                    }

                } else if (
                    index <
                    data.agents.length - 1
                ) {

                    addConnector();
                }

            }
        );


        // ==================================================
        // AGENT DETAILS
        // ==================================================

        if (details) {

            let html = `

                <strong>
                    🤖 Multi-Agent Activity
                </strong>

                <br><br>

            `;


            data.agents.forEach(
                agent => {

                    const info =
                        agentInfo[
                            agent.agent
                        ] || {};


                    html += `

                        <div class="agent-detail-row">

                            <div>

                                <strong>
                                    ${info.icon || "🤖"}
                                    ${agent.agent}
                                </strong>

                                <br>

                                <span>
                                    ${info.description || ""}
                                </span>

                            </div>

                            <strong>
                                ${agent.status}
                            </strong>

                        </div>

                    `;
                }
            );


            // ----------------------------------------------
            // HUMAN APPROVAL DETAILS
            // ----------------------------------------------

            html += `

                <div class="agent-detail-row human-detail-row">

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
                        ${currentPlan.status}
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
                    ${error.message}
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

    try {

        // Check backend first
        await checkSystemStatus();


        // Load dashboard data
        await loadIncidents();

        await loadResources();

        await loadPlan();

        await loadHistory();

        await loadMonitor();

        await loadAuditLog();

        await loadAgents();

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


    // ------------------------------------------------------
    // APPROVE
    // ------------------------------------------------------

    if (approveButton) {

        approveButton.addEventListener(
            "click",
            approvePlan
        );
    }


    // ------------------------------------------------------
    // REJECT
    // ------------------------------------------------------

    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            rejectPlan
        );
    }


    // ------------------------------------------------------
    // REPLAN
    // ------------------------------------------------------

    if (replanButton) {

        replanButton.addEventListener(
            "click",
            replan
        );
    }


    // ------------------------------------------------------
    // AI ANALYSIS
    // ------------------------------------------------------

    if (aiButton) {

        aiButton.addEventListener(
            "click",
            aiAnalysis
        );
    }


    // ------------------------------------------------------
    // NEW EMERGENCY
    // ------------------------------------------------------

    if (newEmergencyButton) {

        newEmergencyButton.addEventListener(
            "click",
            newEmergency
        );
    }


    // ------------------------------------------------------
    // RESOURCE FAILURE
    // ------------------------------------------------------

    if (resourceFailureButton) {

        resourceFailureButton.addEventListener(
            "click",
            resourceFailure
        );
    }


    // ------------------------------------------------------
    // SEVERITY
    // ------------------------------------------------------

    if (severityButton) {

        severityButton.addEventListener(
            "click",
            increaseSeverity
        );
    }


    // ------------------------------------------------------
    // RESET
    // ------------------------------------------------------

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetSimulation
        );
    }


    console.log(
        "All dashboard buttons connected."
    );
}


// ======================================================
// AUTOMATIC REFRESH
// ======================================================

function startAutoRefresh() {

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