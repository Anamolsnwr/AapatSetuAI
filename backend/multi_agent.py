# ============================================================
# backend/multi_agent.py
# AapatSetu AI - Multi-Agent Coordination
# ============================================================


# ============================================================
# ASSESSMENT AGENT
# ============================================================

def assessment_agent(incidents):

    assessed_incidents = []

    for incident in incidents:

        assessed_incidents.append({

            "incident_id":
                incident["id"],

            "type":
                incident["type"],

            "location":
                incident["location"],

            "severity":
                incident["severity"],

            "required_resources":
                incident["required_resources"],

            "status":
                incident["status"]
        })

    return {

        "agent":
            "Assessment Agent",

        "status":
            "Completed",

        "role":
            "Assess emergency incidents and their resource requirements.",

        "incidents_assessed":
            len(assessed_incidents),

        "data":
            assessed_incidents
    }


# ============================================================
# PLANNING AGENT
# ============================================================

def planning_agent(plan):

    assigned = 0

    attention_required = 0

    for assignment in plan:

        if assignment["status"] == "Assigned":

            assigned += 1

        elif (
            assignment["status"]
            ==
            "Human Attention Required"
        ):

            attention_required += 1

    return {

        "agent":
            "Planning Agent",

        "status":
            "Completed",

        "role":
            "Coordinate deterministic resource allocation.",

        "assignments":
            assigned,

        "human_attention_required":
            attention_required
    }


# ============================================================
# SECURITY / SISO AGENT
# ============================================================

def security_agent(security_audit):

    if security_audit["status"] == "Passed":

        return {

            "agent":
                "Security/SISO Agent",

            "status":
                "Passed",

            "role":
                "Validate incidents, resources and response plans.",

            "message":
                "All security checks passed.",

            "audit":
                security_audit
        }

    return {

        "agent":
            "Security/SISO Agent",

        "status":
            "Warning",

        "role":
            "Validate incidents, resources and response plans.",

        "message":
            "Security validation detected issues.",

        "audit":
            security_audit
    }


# ============================================================
# MONITORING AGENT
# ============================================================

def monitoring_agent(changes):

    if changes:

        return {

            "agent":
                "Monitoring Agent",

            "status":
                "Change Detected",

            "role":
                "Monitor emergencies, resources and severity changes.",

            "changes_detected":
                len(changes),

            "action":
                "Re-plan required.",

            "changes":
                changes
        }

    return {

        "agent":
            "Monitoring Agent",

        "status":
            "Monitoring",

        "role":
            "Monitor emergencies, resources and severity changes.",

        "changes_detected":
            0,

        "action":
            "No action required.",

        "changes":
            []
    }


# ============================================================
# RE-PLANNING AGENT
# ============================================================

def replanning_agent(reason):

    return {

        "agent":
            "Re-planning Agent",

        "status":
            "Triggered",

        "role":
            "Trigger a new response plan when conditions change.",

        "reason":
            reason,

        "action":
            "Generate new response plan."
    }


# ============================================================
# HUMAN REVIEW AGENT
# ============================================================

def human_review_agent(plan):

    status = plan.get(
        "status",
        "Unknown"
    )

    if status == "Pending Approval":

        review_status = "Waiting for Human Approval"

    elif status == "Active":

        review_status = "Approved"

    elif status == "Rejected":

        review_status = "Rejected"

    elif status == "Outdated":

        review_status = "Plan Outdated"

    else:

        review_status = status

    return {

        "agent":
            "Human Review",

        "status":
            review_status,

        "role":
            "Allow an emergency operator to approve, reject or modify a plan.",

        "plan_version":
            plan.get(
                "version",
                "Unknown"
            ),

        "action":
            (
                "Human approval required."
                if status == "Pending Approval"
                else
                "No approval action required."
            )
    }


# ============================================================
# COMMAND COORDINATOR
# ============================================================

def command_coordinator(
    assessment,
    planning,
    security,
    human_review,
    monitoring,
    replanning=None
):

    workflow_status = "Operational"

    if security["status"] != "Passed":

        workflow_status = "Security Warning"

    elif monitoring["changes_detected"] > 0:

        workflow_status = "Re-planning Required"

    elif human_review["status"] == "Waiting for Human Approval":

        workflow_status = "Waiting for Human Approval"

    elif human_review["status"] == "Approved":

        workflow_status = "Plan Active"

    return {

        "agent":
            "Command Coordinator",

        "status":
            workflow_status,

        "workflow":
            [
                "Assessment",
                "Planning",
                "Security/SISO",
                "Human Review",
                "Monitoring",
                "Re-planning"
            ],

        "assessment":
            assessment["status"],

        "planning":
            planning["status"],

        "security":
            security["status"],

        "human_review":
            human_review["status"],

        "monitoring":
            monitoring["status"],

        "replanning":
            (
                replanning["status"]
                if replanning
                else
                "Not Triggered"
            )
    }