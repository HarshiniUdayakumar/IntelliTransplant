def coordinate_transplant_decision(
    compatibility_score: float,
    success_probability: float,
    risk_probability: float,
    transport_time_minutes: int
) -> dict:
    """
    Intelligent coordination agent for academic
    organ-transplant decision support.

    Combines outputs from the matching and
    Bayesian reasoning modules.
    """

    actions = []

    # Rule 1: Check compatibility
    if compatibility_score >= 80:
        compatibility_status = "high"
        actions.append("Compatibility requirements satisfied")
    elif compatibility_score >= 60:
        compatibility_status = "moderate"
        actions.append("Compatibility requires review")
    else:
        compatibility_status = "low"
        actions.append("Compatibility is low")

    # Rule 2: Check Bayesian probability
    if success_probability >= 70:
        probability_status = "favorable"
        actions.append("Estimated coordination probability is favorable")
    elif success_probability >= 50:
        probability_status = "moderate"
        actions.append("Estimated coordination probability requires monitoring")
    else:
        probability_status = "low"
        actions.append("Estimated coordination probability is low")

    # Rule 3: Check transport time
    if transport_time_minutes <= 30:
        transport_status = "fast"
        actions.append("Transport time is within the configured threshold")
    elif transport_time_minutes <= 60:
        transport_status = "moderate"
        actions.append("Transport time requires monitoring")
    else:
        transport_status = "long"
        actions.append("Transport time is high")

    # Overall coordination decision
    if (
        compatibility_score >= 80
        and success_probability >= 70
        and transport_time_minutes <= 30
    ):
        decision = "proceed"

    elif (
        compatibility_score >= 60
        and success_probability >= 50
        and transport_time_minutes <= 60
    ):
        decision = "review"

    else:
        decision = "reassess"

    return {
        "decision": decision,
        "compatibility_status": compatibility_status,
        "probability_status": probability_status,
        "transport_status": transport_status,
        "risk_probability": risk_probability,
        "recommended_actions": actions
    }