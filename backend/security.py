# ============================================================
# SECURITY / SISO VALIDATION
# ============================================================

VALID_SEVERITIES = [
    "Critical",
    "High",
    "Medium",
    "Low"
]

REQUIRED_FIELDS = [
    "id",
    "type",
    "location",
    "severity"
]


def validate_incident(incident):

    # --------------------------------------------------------
    # Check required fields
    # --------------------------------------------------------

    for field in REQUIRED_FIELDS:

        if field not in incident:

            return {
                "valid": False,
                "reason": f"Missing field: {field}"
            }


    # --------------------------------------------------------
    # Check empty values
    # --------------------------------------------------------

    for field in REQUIRED_FIELDS:

        if not incident[field]:

            return {
                "valid": False,
                "reason": f"Empty field: {field}"
            }


    # --------------------------------------------------------
    # Check severity
    # --------------------------------------------------------

    if incident["severity"] not in VALID_SEVERITIES:

        return {
            "valid": False,
            "reason": "Invalid severity level"
        }


    # --------------------------------------------------------
    # Validation successful
    # --------------------------------------------------------

    return {
        "valid": True,
        "reason": "Incident data validated successfully"
    }