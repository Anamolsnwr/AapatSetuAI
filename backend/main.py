# ============================================================
# backend/main.py
# AapatSetu AI - Emergency Response Coordination System
# ============================================================


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import json
from pathlib import Path
from datetime import datetime


# ============================================================
# IMPORT PLANNER
# ============================================================

from backend.planner import allocate_resources


# ============================================================
# IMPORT AGENTS
# ============================================================

from backend.agents import (
    assess_all_incidents,
    monitor_changes
)


# ============================================================
# IMPORT SECURITY
# ============================================================

from backend.security import (
    validate_incident,
    run_security_audit
)


# ============================================================
# IMPORT MULTI-AGENTS
# ============================================================

from backend.multi_agent import (
    assessment_agent,
    planning_agent,
    security_agent,
    monitoring_agent,
    replanning_agent,
    human_review_agent,
    command_coordinator
)


# ============================================================
# IMPORT AI AGENT
# ============================================================

from backend.ai_agent import (
    generate_explanation
)


# ============================================================
# FASTAPI APPLICATION
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
# DATA PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

INCIDENTS_FILE = DATA_DIR / "incidents.json"

RESOURCES_FILE = DATA_DIR / "resources.json"


# ============================================================
# SIMULATION DATA
# ============================================================

# These incidents are created only during simulation.
# They must not exist after a simulation reset.

SIMULATED_INCIDENT_IDS = {
    "I005"
}


# ============================================================
# SECURITY TEST MODE
# ============================================================

# This is used only for the hackathon demonstration.
#
# False = normal Security/SISO validation
# True  = controlled security warning simulation
#
# This does NOT modify the JSON files.

security_test_mode = False


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
# LOAD CLEAN INITIAL DATA
# ============================================================

def load_initial_data():

    incidents, resources = load_data()


    # --------------------------------------------------------
    # REMOVE SIMULATION-ONLY INCIDENTS
    # --------------------------------------------------------

    incidents = [

        incident

        for incident in incidents

        if incident.get("id")
        not in SIMULATED_INCIDENT_IDS
    ]


    # --------------------------------------------------------
    # RESET RESOURCE STATUS
    # --------------------------------------------------------

    for resource in resources:

        resource["status"] = "available"


    return incidents, resources


# ============================================================
# APPLY SECURITY TEST MODE
# ============================================================

def apply_security_test(audit):

    if not security_test_mode:
        return audit


    # Create a copy so the original validation result
    # is not accidentally modified elsewhere.

    security_result = dict(audit)


    security_result["status"] = "Warning"


    existing_plan_errors = list(
        security_result.get(
            "plan_errors",
            []
        )
    )


    existing_plan_errors.append({

        "type":
            "Security Test",

        "reason":
            (
                "Controlled security warning "
                "simulation is active."
            )
    })


    security_result["plan_errors"] = (
        existing_plan_errors
    )


    return security_result


# ============================================================
# INITIAL SYSTEM DATA
# ============================================================

incidents, resources = load_initial_data()

plan_version = 1

plan_history = []

audit_log = []


# ============================================================
# AUDIT LOG FUNCTION
# ============================================================

def add_audit_log(action, details):

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
# CREATE RESPONSE PLAN
# ============================================================

def create_plan(
    change_reason="Initial response plan"
):

    # --------------------------------------------------------
    # STEP 1: ASSESS INCIDENTS
    # --------------------------------------------------------

    assessed_incidents = (
        assess_all_incidents(
            incidents
        )
    )


    # --------------------------------------------------------
    # STEP 2: ALLOCATE RESOURCES
    # --------------------------------------------------------

    plan = allocate_resources(
        assessed_incidents,
        resources
    )


    # --------------------------------------------------------
    # STEP 3: SECURITY / SISO VALIDATION
    # --------------------------------------------------------

    security_audit = run_security_audit(

        incidents,

        resources,

        plan
    )


    # Apply controlled security simulation
    security_audit = apply_security_test(
        security_audit
    )


    # --------------------------------------------------------
    # STEP 4: CREATE PLAN OBJECT
    # --------------------------------------------------------

    return {

        "version":
            f"V{plan_version}",

        "status":
            "Pending Approval",

        "change_reason":
            change_reason,

        "plan":
            plan,

        "security":
            security_audit
    }


# ============================================================
# CREATE INITIAL V1 PLAN
# ============================================================

initial_plan = create_plan()


plan_history.append(
    initial_plan
)


add_audit_log(

    "Initial Plan Created",

    (
        "Initial emergency response plan generated "
        "and passed through Security/SISO validation."
    )
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
# GET INCIDENTS
# ============================================================

@app.get("/incidents")
def get_incidents():

    return incidents


# ============================================================
# GET RESOURCES
# ============================================================

@app.get("/resources")
def get_resources():

    return resources


# ============================================================
# GET CURRENT PLAN
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
# RE-PLAN
# ============================================================

@app.post("/replan")
def replan():

    global plan_version


    # --------------------------------------------------------
    # STEP 1: ASSESS CURRENT INCIDENTS
    # --------------------------------------------------------

    assessed_incidents = (
        assess_all_incidents(
            incidents
        )
    )


    # --------------------------------------------------------
    # STEP 2: CREATE NEW RESOURCE PLAN
    # --------------------------------------------------------

    new_plan_data = allocate_resources(

        assessed_incidents,

        resources
    )


    # --------------------------------------------------------
    # STEP 3: INCREASE PLAN VERSION
    # --------------------------------------------------------

    plan_version += 1

    new_version = f"V{plan_version}"


    # --------------------------------------------------------
    # STEP 4: SECURITY / SISO AUDIT
    # --------------------------------------------------------

    security_audit = run_security_audit(

        incidents,

        resources,

        new_plan_data
    )


    # Apply controlled security simulation
    security_audit = apply_security_test(
        security_audit
    )


    # --------------------------------------------------------
    # STEP 5: CREATE NEW PLAN
    # --------------------------------------------------------

    new_plan = {

        "version":
            new_version,

        "status":
            "Pending Approval",

        "change_reason":
            (
                "Emergency situation changed. "
                "Response plan regenerated."
            ),

        "plan":
            new_plan_data,

        "security":
            security_audit
    }


    # --------------------------------------------------------
    # STEP 6: SAVE PLAN HISTORY
    # --------------------------------------------------------

    plan_history.append(
        new_plan
    )


    # --------------------------------------------------------
    # STEP 7: AUDIT LOG
    # --------------------------------------------------------

    add_audit_log(

        "Plan Re-planned",

        (
            f"{new_version} generated because "
            "the emergency situation changed."
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

            "message":
                "No response plan available."
        }


    current_plan = plan_history[-1]


    # --------------------------------------------------------
    # CHECK IF ALREADY ACTIVE
    # --------------------------------------------------------

    if current_plan["status"] == "Active":

        return {

            "message":
                f"{current_plan['version']} is already active."
        }


    # --------------------------------------------------------
    # CHECK IF OUTDATED
    # --------------------------------------------------------

    if current_plan["status"] == "Outdated":

        return {

            "message":
                "This plan is outdated. Please re-plan first."
        }


    # --------------------------------------------------------
    # CHECK IF REJECTED
    # --------------------------------------------------------

    if current_plan["status"] == "Rejected":

        return {

            "message":
                "This plan was rejected and cannot be approved."
        }


    # --------------------------------------------------------
    # SECURITY / SISO CHECK
    # --------------------------------------------------------

    security = current_plan.get(
        "security"
    )


    if security is None:

        return {

            "message":
                (
                    "Plan cannot be approved because "
                    "Security/SISO validation has not been completed."
                )
        }


    # --------------------------------------------------------
    # RE-CHECK SECURITY IF TEST MODE IS ACTIVE
    # --------------------------------------------------------

    if security_test_mode:

        security = apply_security_test(
            security
        )

        current_plan["security"] = security


    if security["status"] != "Passed":

        add_audit_log(

            "Plan Approval Blocked",

            (
                f"{current_plan['version']} approval "
                "was blocked because Security/SISO "
                "validation returned a warning."
            )
        )


        return {

            "message":
                (
                    "Plan cannot be approved because "
                    "Security/SISO validation failed."
                ),

            "security":
                security
        }


    # --------------------------------------------------------
    # HUMAN APPROVAL
    # --------------------------------------------------------

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
            (
                f"{current_plan['version']} "
                "approved successfully."
            ),

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

            "message":
                "No response plan available."
        }


    current_plan = plan_history[-1]


    if current_plan["status"] == "Active":

        return {

            "message":
                "Active plans cannot be rejected."
        }


    if current_plan["status"] == "Outdated":

        return {

            "message":
                "Outdated plans cannot be rejected. Please re-plan."
        }


    if current_plan["status"] == "Rejected":

        return {

            "message":
                f"{current_plan['version']} is already rejected."
        }


    current_plan["status"] = "Rejected"


    add_audit_log(

        "Plan Rejected",

        (
            f"{current_plan['version']} "
            "was rejected during human review."
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
    # FIND RESOURCE
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
    # CHECK RESOURCE AVAILABILITY
    # --------------------------------------------------------

    if selected_resource["status"] != "available":

        return {

            "message":
                "Resource is not available",

            "resource_id":
                resource_id
        }


    # --------------------------------------------------------
    # CHECK RESOURCE DUPLICATE ASSIGNMENT
    # --------------------------------------------------------

    for assignment in current_plan["plan"]:

        if (

            assignment["resource_id"]
            ==
            resource_id

            and

            assignment["incident_id"]
            !=
            incident_id

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
    # MODIFY ASSIGNMENT
    # --------------------------------------------------------

    for assignment in current_plan["plan"]:

        if assignment["incident_id"] == incident_id:

            old_resource = assignment[
                "resource_id"
            ]


            assignment[
                "resource_id"
            ] = resource_id


            assignment[
                "status"
            ] = "Assigned"


            assignment[
                "reason"
            ] = (

                "Assignment modified by "
                "human operator. "

                f"{resource_id} replaced "
                f"{old_resource}."
            )


            # ------------------------------------------------
            # RE-RUN SECURITY AFTER MODIFICATION
            # ------------------------------------------------

            security_audit = run_security_audit(

                incidents,

                resources,

                current_plan["plan"]
            )


            security_audit = apply_security_test(
                security_audit
            )


            current_plan[
                "security"
            ] = security_audit


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
                    current_plan,

                "security":
                    security_audit
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
# SIMULATION - NEW EMERGENCY
# ============================================================

@app.post("/simulate/new-emergency")
def new_emergency():

    for incident in incidents:

        if incident["id"] == "I005":

            return {

                "message":
                    "Factory Fire Emergency already exists",

                "incident":
                    incident
            }


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


    incidents.append(
        new_incident
    )


    # --------------------------------------------------------
    # CURRENT PLAN BECOMES OUTDATED
    # --------------------------------------------------------

    if plan_history:

        current_plan = plan_history[-1]

        if current_plan["status"] in [

            "Pending Approval",

            "Active"

        ]:

            current_plan["status"] = "Outdated"


    add_audit_log(

        "New Emergency",

        (
            "New Critical emergency I005 - "
            "Factory Fire Emergency was detected."
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
# SIMULATION - RESOURCE FAILURE
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
# SIMULATION - INCREASE SEVERITY
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


            old_severity = incident[
                "severity"
            ]


            incident[
                "severity"
            ] = "Critical"


            if plan_history:

                current_plan = plan_history[-1]

                if current_plan["status"] in [

                    "Pending Approval",

                    "Active"

                ]:

                    current_plan["status"] = "Outdated"


            add_audit_log(

                "Severity Changed",

                (
                    f"I001 severity changed "
                    f"from {old_severity} to Critical."
                )
            )


            return {

                "message":
                    (
                        f"I001 severity changed "
                        f"from {old_severity} to Critical"
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
# SIMULATION - SECURITY WARNING
# ============================================================

@app.post("/simulate/security-warning")
def simulate_security_warning():

    global security_test_mode


    security_test_mode = True


    # --------------------------------------------------------
    # UPDATE CURRENT PLAN SECURITY STATUS
    # --------------------------------------------------------

    if plan_history:

        current_plan = plan_history[-1]


        current_security = current_plan.get(
            "security"
        )


        if current_security is not None:

            current_plan["security"] = (
                apply_security_test(
                    current_security
                )
            )


    # --------------------------------------------------------
    # AUDIT EVENT
    # --------------------------------------------------------

    add_audit_log(

        "Security Warning Simulation",

        (
            "Controlled Security/SISO warning "
            "simulation was enabled for demonstration."
        )
    )


    return {

        "message":
            "Security warning simulation enabled.",

        "security_test_mode":
            True,

        "security_status":
            "Warning"
    }


# ============================================================
# DISABLE SECURITY TEST
# ============================================================

@app.post("/simulate/security-reset")
def reset_security_test():

    global security_test_mode


    security_test_mode = False


    # --------------------------------------------------------
    # RE-RUN SECURITY AUDIT
    # --------------------------------------------------------

    if plan_history:

        current_plan = plan_history[-1]


        security_audit = run_security_audit(

            incidents,

            resources,

            current_plan["plan"]
        )


        current_plan[
            "security"
        ] = security_audit


    # --------------------------------------------------------
    # AUDIT EVENT
    # --------------------------------------------------------

    add_audit_log(

        "Security Warning Reset",

        (
            "Controlled Security/SISO warning "
            "simulation was disabled."
        )
    )


    return {

        "message":
            "Security warning simulation disabled.",

        "security_test_mode":
            False,

        "security_status":
            "Passed"
    }


# ============================================================
# VALIDATE DATA
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
# SECURITY STATUS
# ============================================================

@app.get("/security-status")
def security_status():

    if not plan_history:

        return {

            "status":
                "Unknown",

            "security_test_mode":
                security_test_mode
        }


    current_plan = plan_history[-1]


    security_audit = run_security_audit(

        incidents,

        resources,

        current_plan["plan"]
    )


    security_audit = apply_security_test(
        security_audit
    )


    return {

        "system":
            "AapatSetu AI",

        "plan_version":
            current_plan["version"],

        "security_test_mode":
            security_test_mode,

        "security":
            security_audit
    }


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
# AI - EXPLAIN PLAN
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


    current_plan = plan_history[-1]


    previous_plan = None


    if len(plan_history) >= 2:

        previous_plan = plan_history[-2]


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
# AI - EXPLAIN CHANGE
# ============================================================

@app.get("/ai/explain-change")
def explain_change():

    if len(plan_history) < 2:

        return {

            "message":
                "No previous plan available for comparison."
        }


    previous_plan = plan_history[-2]

    current_plan = plan_history[-1]


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

    # --------------------------------------------------------
    # CURRENT PLAN
    # --------------------------------------------------------

    if not plan_history:

        current_plan = create_plan(
            "Temporary plan for agent status"
        )

    else:

        current_plan = plan_history[-1]


    # --------------------------------------------------------
    # 1. ASSESSMENT AGENT
    # --------------------------------------------------------

    assessed = assessment_agent(
        incidents
    )


    # --------------------------------------------------------
    # 2. PLANNING AGENT
    # --------------------------------------------------------

    planning = planning_agent(
        current_plan["plan"]
    )


    # --------------------------------------------------------
    # 3. SECURITY / SISO AGENT
    # --------------------------------------------------------

    security_audit = run_security_audit(

        incidents,

        resources,

        current_plan["plan"]
    )


    security_audit = apply_security_test(
        security_audit
    )


    # Keep current plan security status synchronized
    current_plan["security"] = security_audit


    security = security_agent(
        security_audit
    )


    # --------------------------------------------------------
    # 4. HUMAN REVIEW
    # --------------------------------------------------------

    human_review = human_review_agent(
        current_plan
    )


    # --------------------------------------------------------
    # 5. MONITORING AGENT
    # --------------------------------------------------------

    changes = monitor_changes(

        incidents,

        resources,

        current_plan
    )


    monitoring = monitoring_agent(
        changes
    )


    # --------------------------------------------------------
    # 6. RE-PLANNING AGENT
    # --------------------------------------------------------

    replanning = None


    if changes:

        reason = changes[0].get(

            "reason",

            "Emergency situation changed."
        )


        replanning = replanning_agent(
            reason
        )


    # --------------------------------------------------------
    # 7. COMMAND COORDINATOR
    # --------------------------------------------------------

    coordinator = command_coordinator(

        assessed,

        planning,

        security,

        human_review,

        monitoring,

        replanning
    )


    # --------------------------------------------------------
    # AGENT LIST
    # --------------------------------------------------------

    agents = [

        assessed,

        planning,

        security,

        human_review,

        monitoring

    ]


    if replanning is not None:

        agents.append(
            replanning
        )


    agents.append(
        coordinator
    )


    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {

        "system":
            "AapatSetu AI",

        "plan_version":
            current_plan["version"],

        "plan_status":
            current_plan["status"],

        "workflow_status":
            coordinator["status"],

        "agents":
            agents,

        "workflow":
            coordinator["workflow"]
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

    global security_test_mode


    # --------------------------------------------------------
    # DISABLE SECURITY TEST MODE
    # --------------------------------------------------------

    security_test_mode = False


    # --------------------------------------------------------
    # LOAD CLEAN ORIGINAL DATA
    # --------------------------------------------------------

    incidents, resources = load_initial_data()


    # --------------------------------------------------------
    # RESET VERSION
    # --------------------------------------------------------

    plan_version = 1


    # --------------------------------------------------------
    # CLEAR HISTORY
    # --------------------------------------------------------

    plan_history = []


    # --------------------------------------------------------
    # CLEAR AUDIT LOG
    # --------------------------------------------------------

    audit_log = []


    # --------------------------------------------------------
    # CREATE FRESH V1
    # --------------------------------------------------------

    initial_plan = create_plan(

        "Simulation reset to initial state"
    )


    plan_history.append(
        initial_plan
    )


    # --------------------------------------------------------
    # ADD RESET AUDIT ENTRY
    # --------------------------------------------------------

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