const API = "https://aapatsetu-ai.onrender.com";


// ======================================================
// API REQUEST
// ======================================================

async function getData(url, options = {}) {

    const response = await fetch(url, options);

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

        } catch {}

        throw new Error(message);
    }

    return await response.json();
}


// ======================================================
// INCIDENTS
// ======================================================

async function loadIncidents() {

    const incidents =
        await getData(
            `${API}/incidents`
        );

    document.getElementById(
        "incident-count"
    ).textContent =
        incidents.length;

    const container =
        document.getElementById(
            "incidents-container"
        );

    container.innerHTML = "";

    incidents.forEach(incident => {

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
                    ${incident.severity}
                </p>

                <p>
                    <strong>Resources:</strong>
                    ${incident.required_resources.join(", ")}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${incident.status}
                </p>

            </div>

        `;
    });
}


// ======================================================
// RESOURCES
// ======================================================

async function loadResources() {

    const resources =
        await getData(
            `${API}/resources`
        );

    document.getElementById(
        "resource-count"
    ).textContent =
        resources.length;

    const container =
        document.getElementById(
            "resources-container"
        );

    container.innerHTML = "";

    resources.forEach(resource => {

        const status =
            resource.status === "available"
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
    });
}


// ======================================================
// PLAN
// ======================================================

async function loadPlan() {

    const plan =
        await getData(
            `${API}/plan`
        );

    document.getElementById(
        "plan-version"
    ).textContent =
        plan.version;

    document.getElementById(
        "plan-status"
    ).textContent =
        plan.status;

    const container =
        document.getElementById(
            "plan-container"
        );

    container.innerHTML = `

        <div class="info-box">

            <strong>
                ${plan.version}
            </strong>

            <br>

            Status:
            ${plan.status}

            <br>

            Reason:
            ${plan.change_reason}

        </div>

    `;

    plan.plan.forEach(item => {

        container.innerHTML += `

            <div class="simulation-card">

                <h3>
                    ${
                        item.resource_id
                        || "⚠️ No Resource"
                    }
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
                    ${item.status}
                </p>

                <p>
                    <strong>Reason:</strong>
                    ${item.reason}
                </p>

            </div>

        `;
    });
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

        alert(error.message);
    }
}


// ======================================================
// REJECT PLAN
// ======================================================

async function rejectPlan() {

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

    return text
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

    `;

    data.changes.forEach(change => {

        container.innerHTML += `

            <div class="simulation-card">

                <h3>
                    ${change.type}
                </h3>

                <p>
                    ${change.reason || ""}
                </p>

                <p>
                    <strong>Action:</strong>
                    ${change.action || ""}
                </p>

            </div>

        `;
    });
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

    container.innerHTML = "";

    history.forEach(plan => {

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
    });
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

    container.innerHTML = "";

    const logs =
        data.audit_log || [];

    logs
        .slice()
        .reverse()
        .forEach(log => {

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
        });
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
        // CREATE AGENT WORKFLOW
        // ==================================================

        data.agents.forEach(
            (agent, index) => {

                const info =
                    agentInfo[
                        agent.agent
                    ] || {

                        icon: "🤖",
                        step:
                            index + 1,

                        description:
                            "Emergency response agent."
                    };


                // ==========================================
                // STATUS CLASS
                // ==========================================

                let statusClass =
                    "agent-normal";


                if (
                    agent.status ===
                        "Passed" ||

                    agent.status ===
                        "Completed"
                ) {

                    statusClass =
                        "agent-success";

                }

                else if (
                    agent.status ===
                        "Warning" ||

                    agent.status ===
                        "Change Detected"
                ) {

                    statusClass =
                        "agent-warning";

                }

                else if (
                    agent.status ===
                    "Triggered"
                ) {

                    statusClass =
                        "agent-triggered";

                }

                else if (
                    agent.status ===
                    "Monitoring"
                ) {

                    statusClass =
                        "agent-monitoring";
                }


                // ==========================================
                // CREATE CARD
                // ==========================================

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


                // ==========================================
                // CONNECTOR
                // ==========================================

                if (
                    index <
                    data.agents.length - 1
                ) {

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


            details.innerHTML =
                html;
        }


    }

    catch (error) {

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

    if (
        !confirm(
            "Reset the complete simulation?"
        )
    ) {

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

        alert(error.message);
    }
}


// ======================================================
// LOAD ALL
// ======================================================

async function loadAll() {

    try {

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
    }
}


// ======================================================
// CONNECT BUTTONS
// ======================================================

function connectButtons() {

    document
        .getElementById("approve-plan")
        ?.addEventListener(
            "click",
            approvePlan
        );


    document
        .getElementById("reject-plan")
        ?.addEventListener(
            "click",
            rejectPlan
        );


    document
        .getElementById("replan")
        ?.addEventListener(
            "click",
            replan
        );


    document
        .getElementById("ai-analysis-btn")
        ?.addEventListener(
            "click",
            aiAnalysis
        );


    document
        .getElementById("new-emergency")
        ?.addEventListener(
            "click",
            newEmergency
        );


    document
        .getElementById("resource-failure")
        ?.addEventListener(
            "click",
            resourceFailure
        );


    document
        .getElementById("increase-severity")
        ?.addEventListener(
            "click",
            increaseSeverity
        );


    document
        .getElementById("reset-simulation")
        ?.addEventListener(
            "click",
            resetSimulation
        );


    console.log(
        "All dashboard buttons connected."
    );
}


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "AapatSetu AI dashboard started."
        );

        connectButtons();

        await loadAll();

        console.log(
            "Dashboard data loaded."
        );

    }
);