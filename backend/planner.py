# ============================================================
# backend/planner.py
# ============================================================

SEVERITY_PRIORITY = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1
}


def calculate_priority(incident):

    return SEVERITY_PRIORITY.get(
        incident["severity"],
        0
    )


def allocate_resources(
    incidents,
    resources
):

    sorted_incidents = sorted(
        incidents,
        key=calculate_priority,
        reverse=True
    )

    available_resources = [

        resource.copy()

        for resource in resources

        if resource["status"] == "available"
    ]

    plan = []

    for incident in sorted_incidents:

        for required_type in incident[
            "required_resources"
        ]:

            matching_resources = [

                resource

                for resource in available_resources

                if resource["type"] ==
                required_type
            ]

            if matching_resources:

                same_zone = [

                    resource

                    for resource in matching_resources

                    if resource["location"] ==
                    incident["location"]
                ]

                if same_zone:

                    selected = same_zone[0]

                else:

                    selected = matching_resources[0]

                plan.append({

                    "resource_id":
                        selected["id"],

                    "incident_id":
                        incident["id"],

                    "incident_type":
                        incident["type"],

                    "location":
                        incident["location"],

                    "severity":
                        incident["severity"],

                    "status":
                        "Assigned",

                    "reason":
                        (
                            f"{selected['id']} "
                            f"assigned because "
                            f"the incident has "
                            f"{incident['severity']} "
                            f"priority."
                        )
                })

                available_resources.remove(
                    selected
                )

            else:

                plan.append({

                    "resource_id":
                        None,

                    "incident_id":
                        incident["id"],

                    "incident_type":
                        incident["type"],

                    "location":
                        incident["location"],

                    "severity":
                        incident["severity"],

                    "status":
                        "Human Attention Required",

                    "reason":
                        (
                           (
                                f"No available {required_type} "
                                f"for {incident['id']}. "
                                f"Human attention is required."
                            )
                        )
                })

    return plan