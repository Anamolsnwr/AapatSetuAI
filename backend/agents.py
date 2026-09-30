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

    plan_assignments = current_plan[
        "plan"
    ]

    # --------------------------------------------------------
    # RESOURCE AVAILABILITY
    # --------------------------------------------------------

    for assignment in plan_assignments:

        resource_id = assignment[
            "resource_id"
        ]

        if resource_id is None:
            continue

        for resource in resources:

            if resource["id"] == resource_id:

                if resource["status"] != "available":

                    changes.append({

                        "type":
                            "Resource Unavailable",

                        "resource_id":
                            resource_id,

                        "incident_id":
                            assignment["incident_id"],

                        "reason":
                            (
                                f"{resource_id} "
                                f"assigned to "
                                f"{assignment['incident_id']} "
                                f"is unavailable."
                            ),

                        "action":
                            "Re-plan required"
                    })

    # --------------------------------------------------------
    # NEW INCIDENTS
    # --------------------------------------------------------

    planned_incident_ids = set()

    for assignment in plan_assignments:

        planned_incident_ids.add(
            assignment["incident_id"]
        )

    for incident in incidents:

        if incident["id"] not in planned_incident_ids:

            changes.append({

                "type":
                    "New Emergency",

                "incident_id":
                    incident["id"],

                "severity":
                    incident["severity"],

                "reason":
                    (
                        f"New "
                        f"{incident['severity']} "
                        f"incident detected in "
                        f"{incident['location']}."
                    ),

                "action":
                    "Re-plan required"
            })

    # --------------------------------------------------------
    # SEVERITY CHANGES
    # --------------------------------------------------------

    for incident in incidents:

        for assignment in plan_assignments:

            if (
                assignment["incident_id"]
                ==
                incident["id"]
            ):

                planned_severity = assignment[
                    "severity"
                ]

                current_severity = incident[
                    "severity"
                ]

                if (
                    planned_severity
                    !=
                    current_severity
                ):

                    changes.append({

                        "type":
                            "Severity Changed",

                        "incident_id":
                            incident["id"],

                        "old_severity":
                            planned_severity,

                        "new_severity":
                            current_severity,

                        "reason":
                            (
                                f"{incident['id']} "
                                f"severity changed "
                                f"from "
                                f"{planned_severity} "
                                f"to "
                                f"{current_severity}."
                            ),

                        "action":
                            "Re-plan required"
                    })

                break

    # --------------------------------------------------------
    # HUMAN APPROVAL
    # --------------------------------------------------------

    if (
        current_plan["status"]
        ==
        "Pending Approval"
    ):

        changes.append({

            "type":
                "Human Approval Pending",

            "reason":
                (
                    "Response plan is waiting "
                    "for human approval."
                ),

            "action":
                "Human review required"
        })

    # --------------------------------------------------------
    # OUTDATED PLAN
    # --------------------------------------------------------

    if (
        current_plan["status"]
        ==
        "Outdated"
    ):

        changes.append({

            "type":
                "Plan Outdated",

            "reason":
                (
                    "The current response plan "
                    "is outdated because the "
                    "emergency situation changed."
                ),

            "action":
                "Generate a new plan"
        })

    return changes