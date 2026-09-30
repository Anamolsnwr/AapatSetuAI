from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import json
from pathlib import Path
from datetime import datetime, timezone

from backend.planner import allocate_resources
from backend.agents import (
    assess_all_incidents,
    monitor_changes
)
from backend.security import validate_incident
from backend.ai_agent import generate_explanation


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AapatSetu AI",
    description="Emergency Response and Resource Coordination System"
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
# LOAD DATA
# ============================================================

def load_data():

    with open(
        DATA_DIR / "incidents.json",
        "r",
        encoding="utf-8"
    ) as file:

        incidents = json.load(file)


    with open(
        DATA_DIR / "resources.json",
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
# AUDIT LOG
# ============================================================

def add_audit_log(action, details):

    audit_log.append({

        "timestamp":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "action": action,

        "details": details

    })


# ============================================================
# CREATE PLAN
# ============================================================

def create_plan(
    change_reason="Initial response plan"
):

    validation_results = []

    valid_incidents = []


    for incident in incidents:

        result = validate_incident(
            incident
        )

        validation_results.append({

            "incident_id":
                incident.get("id"),

            "validation":
                result

        })


        if result["valid"]:

            valid_incidents.append(
                incident
            )


    assessed_incidents = assess_all_incidents(
        valid_incidents
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

        "validation":
            validation_results,

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
    "System Started",
    "Initial emergency response plan V1 created."
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

        raise HTTPException(
            status_code=404,
            detail="No plan available"
        )

    return plan_history[-1]


# ============================================================
# PLAN HISTORY
# ============================================================

@app.get("/plan-history")
def get_plan_history():

    return plan_history


# ============================================================
# APPROVE PLAN
# ============================================================

@app.post("/approve-plan")
def approve_plan():

    if not plan_history:

        raise HTTPException(
            status_code=404,
            detail="No plan available"
        )


    current_plan = plan_history[-1]


    if current_plan["status"] != "Pending Approval":

        return {

            "message":
                "Plan is not waiting for approval",

            "status":
                current_plan["status"]

        }


    current_plan["status"] = "Active"


    add_audit_log(
        "Plan Approved",
        f"{current_plan['version']} approved by human operator."
    )


    return {

        "message":
            "Plan approved successfully",

        "plan":
            current_plan

    }


# ============================================================
# REJECT PLAN
# ============================================================

@app.post("/reject-plan")
def reject_plan():

    if not plan_history:

        raise HTTPException(
            status_code=404,
            detail="No plan available"
        )


    current_plan = plan_history[-1]


    if current_plan["status"] != "Pending Approval":

        return {

            "message":
                "Plan is not waiting for approval",

            "status":
                current_plan["status"]

        }


    current_plan["status"] = "Rejected"


    add_audit_log(
        "Plan Rejected",
        f"{current_plan['version']} rejected by human operator."
    )


    return {

        "message":
            "Plan rejected",

        "plan":
            current_plan

    }


# ============================================================
# REPLAN
# ============================================================

@app.post("/replan")
def replan():

    global plan_version


    if not plan_history:

        raise HTTPException(
            status_code=404,
            detail="No existing plan"
        )


    current_plan = plan_history[-1]


    if current_plan["status"] in [
        "Active",
        "Pending Approval",
        "Outdated"
    ]:

        current_plan["status"] = "Superseded"


    plan_version += 1


    new_plan = create_plan(
        "Response plan updated because the situation changed."
    )


    plan_history.append(
        new_plan
    )


    add_audit_log(
        "Plan Re-planned",
        f"New response plan {new_plan['version']} generated."
    )


    return {

        "message":
            "New response plan generated",

        "plan":
            new_plan

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

        raise HTTPException(
            status_code=404,
            detail="No plan available"
        )


    current_plan = plan_history[-1]


    if current_plan["status"] != "Pending Approval":

        return {

            "message":
                "Plan is not waiting for approval",

            "status":
                current_plan["status"]

        }


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


    if selected_resource["status"] != "available":

        return {

            "message":
                "Resource is not available",

            "resource_id":
                resource_id

        }


    for assignment in current_plan["plan"]:

        if (
            assignment["resource_id"] == resource_id
            and assignment["incident_id"] != incident_id
        ):

            return {

                "message":
                    "Resource is already assigned",

                "resource_id":
                    resource_id,

                "assigned_to":
                    assignment["incident_id"]

            }


    for assignment in current_plan["plan"]:

        if assignment["incident_id"] == incident_id:

            old_resource = assignment["resource_id"]


            assignment["resource_id"] = resource_id

            assignment["status"] = "Assigned"

            assignment["reason"] = (
                "Assignment modified by human operator. "
                f"{resource_id} replaced {old_resource}."
            )


            add_audit_log(
                "Plan Modified",
                f"{resource_id} assigned to {incident_id}."
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
# MONITOR
# ============================================================

@app.get("/monitor")
def monitor():

    if not plan_history:

        return {

            "changes_detected":
                False,

            "changes":
                []

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
# NEW EMERGENCY
# ============================================================

@app.post("/simulate/new-emergency")
def new_emergency():

    for incident in incidents:

        if incident["id"] == "I004":

            return {

                "message":
                    "Chemical Factory Accident already exists",

                "incident":
                    incident

            }


    new_incident = {

        "id":
            "I004",

        "type":
            "Chemical Factory Accident",

        "location":
            "Zone D",

        "severity":
            "Critical",

        "required_resources":
            ["Ambulance"],

        "status":
            "Active"

    }


    incidents.append(
        new_incident
    )


    if plan_history:

        current_plan = plan_history[-1]


        if current_plan["status"] in [
            "Pending Approval",
            "Active"
        ]:

            current_plan["status"] = "Outdated"


    add_audit_log(
        "New Emergency",
        "Critical chemical factory accident I004 detected."
    )


    return {

        "message":
            "New critical emergency detected",

        "incident":
            new_incident

    }


# ============================================================
# RESOURCE FAILURE
# ============================================================

@app.post("/simulate/resource-failure")
def resource_failure():

    for resource in resources:

        if resource["id"] == "A2":

            if resource["status"] == "unavailable":

                return {

                    "message":
                        "Ambulance A2 is already unavailable",

                    "resource":
                        resource

                }


            resource["status"] = "unavailable"


            if plan_history:

                current_plan = plan_history[-1]


                if current_plan["status"] in [
                    "Pending Approval",
                    "Active"
                ]:

                    current_plan["status"] = "Outdated"


            add_audit_log(
                "Resource Failure",
                "Ambulance A2 marked unavailable."
            )


            return {

                "message":
                    "Ambulance A2 is unavailable",

                "resource":
                    resource

            }


    return {

        "message":
            "A2 not found"

    }


# ============================================================
# INCREASE SEVERITY
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


            old_severity = incident["severity"]

            incident["severity"] = "Critical"


            if plan_history:

                current_plan = plan_history[-1]


                if current_plan["status"] in [
                    "Pending Approval",
                    "Active"
                ]:

                    current_plan["status"] = "Outdated"


            add_audit_log(
                "Severity Increased",
                f"I001 changed from {old_severity} to Critical."
            )


            return {

                "message":
                    f"I001 severity changed from "
                    f"{old_severity} to Critical",

                "incident":
                    incident

            }


    return {

        "message":
            "Incident I001 not found"

    }


# ============================================================
# VALIDATE
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
# AI EXPLAIN PLAN
# ============================================================

@app.get("/ai/explain-plan")
def explain_plan():

    if not plan_history:

        raise HTTPException(
            status_code=404,
            detail="No plan available"
        )


    current_plan = plan_history[-1]


    try:

        explanation = generate_explanation(

            current_plan,

            incidents,

            resources,

            None

        )


        return {

            "plan_version":
                current_plan["version"],

            "ai_analysis":
                explanation

        }


    except Exception as error:

        print(
            "AI EXPLANATION ERROR:",
            error
        )


        raise HTTPException(

            status_code=502,

            detail=
                f"AI service error: {str(error)}"

        )


# ============================================================
# AI EXPLAIN CHANGE
# ============================================================

@app.get("/ai/explain-change")
def explain_change():

    if len(plan_history) < 2:

        return {

            "message":
                "No previous plan available for comparison.",

            "ai_analysis": {

                "summary":
                    "This is the first response plan. "
                    "There is no previous plan to compare."

            }

        }


    previous_plan = plan_history[-2]

    current_plan = plan_history[-1]


    try:

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


    except Exception as error:

        print(
            "AI CHANGE EXPLANATION ERROR:",
            error
        )


        raise HTTPException(

            status_code=502,

            detail=
                f"AI service error: {str(error)}"

        )


# ============================================================
# RESET
# ============================================================

@app.post("/reset")
def reset_simulation():

    global incidents
    global resources
    global plan_version
    global plan_history
    global audit_log


    incidents, resources = load_data()

    plan_version = 1

    plan_history = []

    audit_log = []


    initial_plan = create_plan(
        "Simulation reset to initial state."
    )


    plan_history.append(
        initial_plan
    )


    add_audit_log(
        "Simulation Reset",
        "Simulation returned to the initial state."
    )


    return {

        "message":
            "Simulation reset successfully",

        "plan":
            initial_plan

    }