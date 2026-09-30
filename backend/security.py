# ============================================================
# backend/security.py
# ============================================================


# ============================================================
# VALID VALUES
# ============================================================

VALID_SEVERITIES = [
    "Critical",
    "High",
    "Medium",
    "Low"
]


VALID_RESOURCE_TYPES = [
    "Ambulance",
    "Rescue Team"
]


REQUIRED_INCIDENT_FIELDS = [
    "id",
    "type",
    "location",
    "severity"
]


# ============================================================
# INCIDENT VALIDATION
# ============================================================

def validate_incident(incident):

    # Check required fields
    for field in REQUIRED_INCIDENT_FIELDS:

        if field not in incident:

            return {
                "valid": False,
                "reason":
                    f"Missing field: {field}"
            }

    # Check empty fields
    for field in REQUIRED_INCIDENT_FIELDS:

        if not incident[field]:

            return {
                "valid": False,
                "reason":
                    f"Empty field: {field}"
            }

    # Check severity
    if (
        incident["severity"]
        not in
        VALID_SEVERITIES
    ):

        return {
            "valid": False,
            "reason":
                "Invalid severity level"
        }

    return {
        "valid": True,
        "reason":
            "Incident data validated successfully"
    }


# ============================================================
# DUPLICATE INCIDENT DETECTION
# ============================================================

def detect_duplicate_incidents(
    incidents
):

    seen_ids = set()

    duplicates = []

    for incident in incidents:

        incident_id = incident["id"]

        if incident_id in seen_ids:

            duplicates.append(
                incident_id
            )

        else:

            seen_ids.add(
                incident_id
            )

    return duplicates


# ============================================================
# RESOURCE VALIDATION
# ============================================================

def validate_resources(
    resources
):

    invalid_resources = []

    for resource in resources:

        if (
            resource["type"]
            not in
            VALID_RESOURCE_TYPES
        ):

            invalid_resources.append({

                "resource_id":
                    resource["id"],

                "type":
                    resource["type"],

                "reason":
                    "Invalid resource type"
            })

    return invalid_resources


# ============================================================
# PLAN VALIDATION
# ============================================================

def validate_plan(
    plan,
    incidents,
    resources
):

    errors = []

    incident_ids = {

        incident["id"]

        for incident in incidents
    }

    resource_ids = {

        resource["id"]

        for resource in resources
    }

    for assignment in plan:

        incident_id = assignment[
            "incident_id"
        ]

        resource_id = assignment[
            "resource_id"
        ]

        # Check incident
        if (
            incident_id
            not in
            incident_ids
        ):

            errors.append({

                "type":
                    "Invalid Incident",

                "incident_id":
                    incident_id,

                "reason":
                    "Incident does not exist"
            })

        # Check resource
        if resource_id is not None:

            if (
                resource_id
                not in
                resource_ids
            ):

                errors.append({

                    "type":
                        "Invalid Resource",

                    "resource_id":
                        resource_id,

                    "reason":
                        "Resource does not exist"
                })

    return errors


# ============================================================
# COMPLETE SECURITY AUDIT
# ============================================================

def run_security_audit(
    incidents,
    resources,
    plan
):

    # --------------------------------------------------------
    # Incident validation
    # --------------------------------------------------------

    incident_validation = []

    for incident in incidents:

        result = validate_incident(
            incident
        )

        incident_validation.append({

            "incident_id":
                incident["id"],

            "validation":
                result
        })


    # --------------------------------------------------------
    # Duplicate detection
    # --------------------------------------------------------

    duplicate_incidents = (
        detect_duplicate_incidents(
            incidents
        )
    )


    # --------------------------------------------------------
    # Resource validation
    # --------------------------------------------------------

    invalid_resources = (
        validate_resources(
            resources
        )
    )


    # --------------------------------------------------------
    # Plan validation
    # --------------------------------------------------------

    plan_errors = (
        validate_plan(
            plan,
            incidents,
            resources
        )
    )


    # --------------------------------------------------------
    # Check overall result
    # --------------------------------------------------------

    all_incidents_valid = all(

        result["validation"]["valid"]

        for result
        in incident_validation
    )


    security_passed = (

        all_incidents_valid

        and
        len(duplicate_incidents) == 0

        and
        len(invalid_resources) == 0

        and
        len(plan_errors) == 0
    )


    # --------------------------------------------------------
    # Final audit result
    # --------------------------------------------------------

    return {

        "status":
            (
                "Passed"
                if security_passed
                else
                "Warning"
            ),

        "incident_validation":
            incident_validation,

        "duplicate_incidents":
            duplicate_incidents,

        "invalid_resources":
            invalid_resources,

        "plan_errors":
            plan_errors
    }