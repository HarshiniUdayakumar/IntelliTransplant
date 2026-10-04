from app.ai_engines.csp_engine import blood_group_compatible


def check_eligibility(
    organ: dict,
    recipient: dict
) -> dict:
    """
    Rule-based eligibility checker.

    This engine applies predefined knowledge rules
    before the CSP matching process.
    """

    rules = []
    failed_rules = []

    # Rule 1: Organ must be available
    if organ["status"] == "available":
        rules.append("Organ is available")
    else:
        failed_rules.append("Organ is not available")

    # Rule 2: Recipient must be waiting
    if recipient["status"] == "waiting":
        rules.append("Recipient is waiting")
    else:
        failed_rules.append("Recipient is not waiting")

    # Rule 3: Organ type must match
    if organ["organ_type"].lower() == recipient["organ_type"].lower():
        rules.append("Organ type matches recipient requirement")
    else:
        failed_rules.append("Organ type does not match")

    # Rule 4: Blood group compatibility
    if blood_group_compatible(
        organ["blood_group"],
        recipient["blood_group"]
    ):
        rules.append("Blood group is compatible")
    else:
        failed_rules.append("Blood group is incompatible")

    # Rule 5: Recipient age must be valid
    if 1 <= recipient["age"] <= 120:
        rules.append("Recipient age is valid")
    else:
        failed_rules.append("Recipient age is invalid")

    eligible = len(failed_rules) == 0

    return {
        "eligible": eligible,
        "rules_passed": rules,
        "rules_failed": failed_rules
    }