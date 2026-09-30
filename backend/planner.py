# ============================================================
# backend/planner.py
# AapatSetu AI - Resource Allocation Planner
# ============================================================


SEVERITY_PRIORITY = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1
}


def calculate_priority(incident):

    severity = incident.get("severity", "Low")

    return SEVERITY_PRIORITY.get(severity, 0)


def allocate_resources(incidents, resources):

    # Sort incidents by severity
    sorted_incidents = sorted(
        incidents,
        key=calculate_priority,
        reverse=True
    )

    # Get only available resources
    available_resources = [
        resource.copy()
        for resource in resources
        if resource.get("status") == "available"
    ]

    # Store the response plan
    plan = []

    # Process each incident
    for incident in sorted_incidents:

        required_resources = incident.get(
            "required_resources",
            []
        )

        # Process each required resource
        for required_type in required_resources:

            # Find matching resources
            matching_resources = [
                resource
                for resource in available_resources
                if resource.get("type") == required_type
            ]

            # If a resource is available
            if matching_resources:

                # Find same-location resources
                same_location = [
                    resource
                    for resource in matching_resources
                    if resource.get("location") == incident.get("location")
                ]

                # Select resource
                if same_location:

                    selected = same_location[0]

                    reason = (
                        f"{selected['id']} assigned because "
                        f"it is an available {required_type} "
                        f"in the same location as "
                        f"incident {incident['id']}."
                    )

                else:

                    selected = matching_resources[0]

                    reason = (
                        f"{selected['id']} assigned because "
                        f"it is an available {required_type}. "
                        f"No same-location resource was available "
                        f"for incident {incident['id']}."
                    )

                # Add assignment to plan
                plan.append(
                    {
                        "resource_id": selected["id"],
                        "incident_id": incident["id"],
                        "incident_type": incident["type"],
                        "location": incident["location"],
                        "severity": incident["severity"],
                        "status": "Assigned",
                        "reason": reason
                    }
                )

                # Remove used resource
                available_resources.remove(selected)

            # If no resource is available
            else:

                plan.append(
                    {
                        "resource_id": None,
                        "incident_id": incident["id"],
                        "incident_type": incident["type"],
                        "location": incident["location"],
                        "severity": incident["severity"],
                        "status": "Human Attention Required",
                        "reason": (
                            f"No available {required_type} "
                            f"for incident {incident['id']}. "
                            f"Human attention is required."
                        )
                    }
                )

    # Return the completed plan
    return plan