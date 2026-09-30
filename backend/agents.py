# ============================================================
# backend/agents.py
# ============================================================


# ============================================================
# INCIDENT ASSESSMENT AGENT
# ============================================================

def assess_incident(incident):

    return {

        "id":
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
    }


def assess_all_incidents(incidents):

    assessed = []

    for incident in incidents:

        assessed.append(
            assess_incident(
                incident
            )
        )

    return assessed


# ============================================================
# MONITORING AGENT
# ============================================================

def monitor_changes(
    incidents,
    resources,
    current_plan
):

    changes = []

    # ========================================================
    # 1. CHECK RESOURCE AVAILABILITY
    # ========================================================

    for assignment in current_plan.get("plan", []):

        resource_id = assignment.get(
            "resource_id"
        )

        if resource_id is None:
            continue

        resource = next(
            (
                r for r in resources
                if r["id"] == resource_id
            ),
            None
        )

        if resource is not None:

            if resource["status"] != "available":

                changes.append({

                    "type":
                        "Resource Unavailable",

                    "resource_id":
                        resource_id,

                    "incident_id":
                        assignment["incident_id"],

                    "reason":
                        f"{resource_id} is no longer available.",

                    "action":
                        "Re-planning required"
                })


    # ========================================================
    # 2. CHECK FOR NEW INCIDENTS
    # ========================================================

    planned_incidents = {
        assignment["incident_id"]
        for assignment in current_plan.get(
            "plan",
            []
        )
    }

    for incident in incidents:

        if (
            incident["id"]
            not in planned_incidents
        ):

            changes.append({

                "type":
                    "New Emergency",

                "incident_id":
                    incident["id"],

                "reason":
                    f"New emergency detected: "
                    f"{incident['type']}",

                "action":
                    "Re-planning required"
            })


    # ========================================================
    # 3. CHECK SEVERITY CHANGES
    # ========================================================

    for incident in incidents:

        for assignment in current_plan.get(
            "plan",
            []
        ):

            if (
                assignment["incident_id"]
                ==
                incident["id"]
            ):

                if (
                    assignment["severity"]
                    !=
                    incident["severity"]
                ):

                    changes.append({

                        "type":
                            "Severity Changed",

                        "incident_id":
                            incident["id"],

                        "old_severity":
                            assignment["severity"],

                        "new_severity":
                            incident["severity"],

                        "reason":
                            f"Severity changed from "
                            f"{assignment['severity']} "
                            f"to "
                            f"{incident['severity']}.",

                        "action":
                            "Re-planning required"
                    })


    # ========================================================
    # IMPORTANT:
    # HUMAN APPROVAL IS NOT A CHANGE
    # ========================================================

    # Do NOT add "Human Approval Pending"
    # to the changes list.
    #
    # Human approval is a workflow state,
    # not a reason to generate another plan.


    return changes