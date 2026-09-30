from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import json
from pathlib import Path
from datetime import datetime

from backend.planner import allocate_resources

from backend.agents import (
    assess_all_incidents,
    monitor_changes
)

from backend.security import (
    validate_incident,
    run_security_audit
)

from backend.multi_agent import (
    assessment_agent,
    planning_agent,
    security_agent,
    monitoring_agent,
    replanning_agent
)

from backend.ai_agent import (
    generate_explanation
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AapatSetu AI",
    description=(
        "Emergency Response and Resource "
        "Coordination System"
    )
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

INCIDENTS_FILE = DATA_DIR / "incidents.json"

RESOURCES_FILE = DATA_DIR / "resources.json"


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    with open(
        INCIDENTS_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        incidents = json.load(file)

    with open(
        RESOURCES_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        resources = json.load(file)

    return incidents, resources


# ============================================================
# SYSTEM STATE
# ============================================================

incidents, resources = load_data()

plan_version = 1

plan_history = []

audit_log = []


# ============================================================
# AUDIT LOG HELPER
# ============================================================

def add_audit_log(
    action,
    details
):

    audit_log.append({

        "timestamp":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

        "action":
            action,

        "details":
            details
    })


# ============================================================
# CREATE PLAN
# ============================================================

def create_plan(
    change_reason="Initial response plan"
):

    assessed_incidents = assess_all_incidents(
        incidents
    )

    plan = allocate_resources(
        assessed_incidents,
        resources
    )

    return {

        "version":
            f"V{plan_version}",

        "status":
            "Pending Approval",

        "change_reason":
            change_reason,

        "plan":
            plan
    }


# ============================================================
# INITIAL PLAN
# ============================================================

initial_plan = create_plan()

plan_history.append(
    initial_plan
)

add_audit_log(
    "Initial Plan Created",
    "Initial emergency response plan generated."
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {

        "system":
            "AapatSetu AI",

        "status":
            "running"
    }


# ============================================================
# INCIDENTS
# ============================================================

@app.get("/incidents")
def get_incidents():

    return incidents


# ============================================================
# RESOURCES
# ============================================================

@app.get("/resources")
def get_resources():

    return resources


# ============================================================
# CURRENT PLAN
# ============================================================

@app.get("/plan")
def get_plan():

    if not plan_history:

        return {
            "message":
                "No plan available"
        }

    return plan_history[-1]


# ============================================================
# REPLAN
# ============================================================

@app.post("/replan")
def replan():

    global plan_version

    # Create a new plan
    new_plan_data = allocate_resources(
        incidents,
        resources
    )

    # Increase plan version
    plan_version += 1

    new_version = f"V{plan_version}"

    # Validate the new plan
    security_audit = run_security_audit(
        incidents,
        resources,
        new_plan_data
    )

    # Create new plan record
    new_plan = {

        "version":
            new_version,

        "status":
            "Pending Approval",

        "change_reason":
            "Emergency situation changed. "
            "Response plan regenerated.",

        "plan":
            new_plan_data,

        "security":
            security_audit
    }

    # Add to history
    plan_history.append(
        new_plan
    )

    # Audit log
    add_audit_log(
        "Plan Re-planned",
        (
            f"{new_version} generated "
            "because the emergency situation changed."
        )
    )

    return {

        "message":
            f"{new_version} generated successfully",

        "plan":
            new_plan,

        "security":
            security_audit
    }

# ============================================================
# APPROVE PLAN
# ============================================================

@app.post("/approve-plan")
def approve_plan():

    if not plan_history:
        return {
            "message": "No response plan available."
        }

    current_plan = plan_history[-1]

    if current_plan["status"] == "Active":
        return {
            "message":
                f"{current_plan['version']} is already active."
        }

    if current_plan["status"] == "Outdated":
        return {
            "message":
                "This plan is outdated. Please re-plan first."
        }

    # Security must pass before approval
    security = current_plan.get("security")

    if security:
        if security["status"] != "Passed":
            return {
                "message":
                    "Plan cannot be approved because security validation failed.",
                "security":
                    security
            }

    current_plan["status"] = "Active"

    add_audit_log(
        "Plan Approved",
        (
            f"{current_plan['version']} was approved "
            "by human review and is now active."
        )
    )

    return {
        "message":
            f"{current_plan['version']} approved successfully.",

        "version":
            current_plan["version"],

        "status":
            current_plan["status"]
    }

# ============================================================
# REJECT PLAN
# ============================================================

@app.post("/reject-plan")
def reject_plan():

    if not plan_history:
        return {
            "message": "No response plan available."
        }

    current_plan = plan_history[-1]

    if current_plan["status"] == "Active":
        return {
            "message":
                "Active plans cannot be rejected."
        }

    current_plan["status"] = "Rejected"

    add_audit_log(
        "Plan Rejected",
        (
            f"{current_plan['version']} was rejected "
            "during human review."
        )
    )

    return {
        "message":
            f"{current_plan['version']} rejected.",

        "version":
            current_plan["version"],

        "status":
            current_plan["status"]
    }


# ============================================================
# MODIFY PLAN
# ============================================================

@app.post("/modify-plan")
def modify_plan(
    resource_id: str,
    incident_id: str
):

    if not plan_history:

        return {

            "message":
                "No plan available"
        }


    current_plan = plan_history[-1]


    if current_plan["status"] != "Pending Approval":

        return {

            "message":
                "Plan is not waiting for approval",

            "status":
                current_plan["status"]
        }


    # --------------------------------------------------------
    # Find resource
    # --------------------------------------------------------

    selected_resource = None

    for resource in resources:

        if resource["id"] == resource_id:

            selected_resource = resource

            break


    if selected_resource is None:

        return {

            "message":
                "Resource not found",

            "resource_id":
                resource_id
        }


    # --------------------------------------------------------
    # Check availability
    # --------------------------------------------------------

    if selected_resource["status"] != "available":

        return {

            "message":
                "Resource is not available",

            "resource_id":
                resource_id
        }


    # --------------------------------------------------------
    # Check duplicate assignment
    # --------------------------------------------------------

    for assignment in current_plan["plan"]:

        if (
            assignment["resource_id"]
            == resource_id
            and
            assignment["incident_id"]
            != incident_id
        ):

            return {

                "message":
                    "Resource is already assigned",

                "resource_id":
                    resource_id,

                "assigned_to":
                    assignment["incident_id"]
            }


    # --------------------------------------------------------
    # Modify assignment
    # --------------------------------------------------------

    for assignment in current_plan["plan"]:

        if assignment["incident_id"] == incident_id:

            old_resource = assignment["resource_id"]


            assignment["resource_id"] = resource_id


            assignment["status"] = "Assigned"


            assignment["reason"] = (

                "Assignment modified by "
                "human operator. "

                f"{resource_id} replaced "
                f"{old_resource}."
            )


            add_audit_log(
                "Plan Modified",
                (
                    f"{resource_id} assigned to "
                    f"{incident_id} by human operator."
                )
            )


            return {

                "message":
                    "Plan modified successfully",

                "plan":
                    current_plan
            }


    return {

        "message":
            "Incident not found in current plan",

        "incident_id":
            incident_id
    }


# ============================================================
# PLAN HISTORY
# ============================================================

@app.get("/plan-history")
def get_plan_history():

    return plan_history


# ============================================================
# MONITOR
# ============================================================

@app.get("/monitor")
def monitor():

    if not plan_history:

        return {

            "message":
                "No plan available"
        }


    current_plan = plan_history[-1]


    changes = monitor_changes(
        incidents,
        resources,
        current_plan
    )


    return {

        "plan_version":
            current_plan["version"],

        "changes_detected":
            len(changes) > 0,

        "changes":
            changes
    }


# ============================================================
# SIMULATION — NEW EMERGENCY
# ============================================================

@app.post("/simulate/new-emergency")
def new_emergency():

    # Check whether I005 already exists
    for incident in incidents:

        if incident["id"] == "I005":

            return {
                "message":
                    "Factory Fire Emergency already exists",

                "incident":
                    incident
            }

    # Create new emergency
    new_incident = {

        "id":
            "I005",

        "type":
            "Factory Fire Emergency",

        "location":
            "Zone B",

        "severity":
            "Critical",

        "required_resources":
            [
                "Ambulance",
                "Rescue Team"
            ],

        "status":
            "Active"
    }

    # Add the emergency
    incidents.append(
        new_incident
    )

    # Mark current plan as outdated
    if plan_history:

        current_plan = plan_history[-1]

        if current_plan["status"] in [
            "Pending Approval",
            "Active"
        ]:

            current_plan["status"] = "Outdated"

    # Add audit log
    add_audit_log(
        "New Emergency",
        (
            "New Critical emergency "
            "I005 - Factory Fire Emergency "
            "was detected."
        )
    )

    return {

        "message":
            "New critical emergency detected",

        "incident":
            new_incident,

        "plan_status":
            plan_history[-1]["status"]
    }

# ============================================================
# SIMULATION — RESOURCE FAILURE
# ============================================================

@app.post("/simulate/resource-failure")
def resource_failure():

    for resource in resources:

        if resource["id"] == "A2":

            if resource["status"] != "available":

                return {
                    "message":
                        "A2 is already unavailable",

                    "resource":
                        resource
                }

            resource["status"] = "unavailable"

            add_audit_log(
                "Resource Failure",
                (
                    "Ambulance A2 became unavailable. "
                    "Re-planning may be required."
                )
            )

            # Mark current plan as outdated
            if plan_history:

                current_plan = plan_history[-1]

                if current_plan["status"] in [
                    "Pending Approval",
                    "Active"
                ]:

                    current_plan["status"] = "Outdated"

            return {

                "message":
                    "Resource failure detected: A2 is unavailable",

                "resource":
                    resource
            }


    return {
        "message":
            "Resource A2 was not found."
    }


# ============================================================
# SIMULATION — INCREASE SEVERITY
# ============================================================

@app.post("/simulate/increase-severity")
def increase_severity():

    for incident in incidents:

        if incident["id"] == "I001":

            if incident["severity"] == "Critical":

                return {

                    "message":
                        "I001 is already Critical",

                    "incident":
                        incident
                }


            old_severity = \
                incident["severity"]


            incident["severity"] = \
                "Critical"


            # ------------------------------------------------
            # Mark current plan outdated
            # ------------------------------------------------

            if plan_history:

                current_plan = plan_history[-1]

                if current_plan["status"] in [
                    "Pending Approval",
                    "Active"
                ]:

                    current_plan["status"] = \
                        "Outdated"


            add_audit_log(
                "Severity Changed",
                (
                    f"I001 severity changed "
                    f"from {old_severity} "
                    "to Critical."
                )
            )


            return {

                "message":
                    (
                        f"I001 severity changed "
                        f"from {old_severity} "
                        "to Critical"
                    ),

                "incident":
                    incident,

                "plan_status":
                    plan_history[-1]["status"]
            }


    return {

        "message":
            "Incident I001 not found"
    }


# ============================================================
# SECURITY VALIDATION
# ============================================================

@app.get("/validate")
def validate_data():

    results = []

    for incident in incidents:

        result = validate_incident(
            incident
        )

        results.append({

            "incident_id":
                incident["id"],

            "validation":
                result
        })


    return results


# ============================================================
# AUDIT LOG
# ============================================================

@app.get("/audit-log")
def get_audit_log():

    return {

        "audit_log":
            audit_log
    }


# ============================================================
# AI — EXPLAIN CURRENT PLAN
# ============================================================

@app.get("/ai/explain-plan")
def explain_plan():

    if not plan_history:

        return {

            "message":
                "No plan available",

            "ai_analysis":
                None
        }


    current_plan = \
        plan_history[-1]


    previous_plan = None

    if len(plan_history) >= 2:

        previous_plan = \
            plan_history[-2]


    explanation = generate_explanation(

        current_plan,

        incidents,

        resources,

        previous_plan
    )


    return {

        "version":
            current_plan["version"],

        "ai_analysis":
            explanation
    }


# ============================================================
# AI — EXPLAIN CHANGE
# ============================================================

@app.get("/ai/explain-change")
def explain_change():

    if len(plan_history) < 2:

        return {

            "message":
                "No previous plan available for comparison."
        }


    previous_plan = \
        plan_history[-2]


    current_plan = \
        plan_history[-1]


    explanation = generate_explanation(

        current_plan,

        incidents,

        resources,

        previous_plan
    )


    return {

        "previous_version":
            previous_plan["version"],

        "current_version":
            current_plan["version"],

        "ai_analysis":
            explanation
    }


# ============================================================
# MULTI-AGENT STATUS
# ============================================================

@app.get("/agents/status")
def get_agent_status():

    # ========================================================
    # 1. ASSESSMENT AGENT
    # ========================================================

    assessed = assessment_agent(
        incidents
    )


    # ========================================================
    # 2. CURRENT PLAN
    # ========================================================

    if not plan_history:

        current_plan = create_plan(
            "Temporary plan for agent status"
        )

    else:

        current_plan = \
            plan_history[-1]


    # ========================================================
    # 3. PLANNING AGENT
    # ========================================================

    planning = planning_agent(
        current_plan["plan"]
    )


    # ========================================================
    # 4. SECURITY / SISO AGENT
    # ========================================================

    security_audit = run_security_audit(

        incidents,

        resources,

        current_plan["plan"]
    )


    security = security_agent(
        security_audit
    )


    # ========================================================
    # 5. MONITORING AGENT
    # ========================================================

    changes = monitor_changes(

        incidents,

        resources,

        current_plan
    )


    monitoring = monitoring_agent(
        changes
    )


    # ========================================================
    # 6. RE-PLANNING AGENT
    # ========================================================

    replanning = None


    if changes:

        reason = \
            changes[0].get(
                "reason",
                "Emergency situation changed."
            )


        replanning = replanning_agent(
            reason
        )


    # ========================================================
    # FINAL AGENT RESPONSE
    # ========================================================

    agents = [

        assessed,

        planning,

        security,

        monitoring
    ]


    if replanning is not None:

        agents.append(
            replanning
        )


    return {

        "system":
            "AapatSetu AI",

        "agents":
            agents
    }


# ============================================================
# RESET SIMULATION
# ============================================================

@app.post("/reset")
def reset_simulation():

    global incidents
    global resources
    global plan_version
    global plan_history
    global audit_log


    # --------------------------------------------------------
    # Reload original data
    # --------------------------------------------------------

    incidents, resources = \
        load_data()


    # --------------------------------------------------------
    # Reset plan state
    # --------------------------------------------------------

    plan_version = 1

    plan_history = []

    audit_log = []


    # --------------------------------------------------------
    # Create fresh V1
    # --------------------------------------------------------

    initial_plan = create_plan(
        "Simulation reset to initial state"
    )


    plan_history.append(
        initial_plan
    )


    add_audit_log(
        "Simulation Reset",
        "Simulation returned to initial state."
    )


    return {

        "message":
            "Simulation reset successfully",

        "plan":
            initial_plan
    }