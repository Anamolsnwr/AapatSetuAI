# ============================================================
# backend/multi_agent.py
# ============================================================


# ============================================================
# ASSESSMENT AGENT
# ============================================================

def assessment_agent(
    incidents
):

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

        "incidents_assessed":
            len(assessed_incidents),

        "data":
            assessed_incidents
    }


# ============================================================
# PLANNING AGENT
# ============================================================

def planning_agent(
    plan
):

    assigned = 0

    attention_required = 0


    for assignment in plan:

        if (
            assignment["status"]
            ==
            "Assigned"
        ):

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

        "assignments":
            assigned,

        "human_attention_required":
            attention_required
    }


# ============================================================
# SECURITY / SISO AGENT
# ============================================================

def security_agent(
    security_audit
):

    if (
        security_audit["status"]
        ==
        "Passed"
    ):

        return {

            "agent":
                "Security/SISO Agent",

            "status":
                "Passed",

            "message":
                "All security checks passed",

            "audit":
                security_audit
        }


    return {

        "agent":
            "Security/SISO Agent",

        "status":
            "Warning",

        "message":
            "Security validation detected issues",

        "audit":
            security_audit
    }


# ============================================================
# MONITORING AGENT
# ============================================================

def monitoring_agent(
    changes
):

    if changes:

        return {

            "agent":
                "Monitoring Agent",

            "status":
                "Change Detected",

            "changes_detected":
                len(changes),

            "action":
                "Re-plan required",

            "changes":
                changes
        }


    return {

        "agent":
            "Monitoring Agent",

        "status":
            "Monitoring",

        "changes_detected":
            0,

        "action":
            "No action required",

        "changes":
            []
    }


# ============================================================
# RE-PLANNING AGENT
# ============================================================

def replanning_agent(
    reason
):

    return {

        "agent":
            "Re-planning Agent",

        "status":
            "Triggered",

        "reason":
            reason,

        "action":
            "Generate new response plan"
    }