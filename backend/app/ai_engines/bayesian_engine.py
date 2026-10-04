def calculate_risk_probability(
    urgency_level: int,
    pra_percentage: float,
    transport_time_minutes: int
) -> dict:
    """
    Simple Bayesian-style probabilistic reasoning
    for academic decision support.

    Uses predefined probabilities and Bayes' theorem.
    """

    # Prior probability of a successful coordination
    prior_success = 0.80

    # Evidence likelihoods
    if urgency_level >= 4:
        urgency_likelihood = 0.90
    elif urgency_level >= 2:
        urgency_likelihood = 0.75
    else:
        urgency_likelihood = 0.60

    if pra_percentage <= 20:
        pra_likelihood = 0.90
    elif pra_percentage <= 50:
        pra_likelihood = 0.75
    else:
        pra_likelihood = 0.55

    if transport_time_minutes <= 30:
        transport_likelihood = 0.90
    elif transport_time_minutes <= 60:
        transport_likelihood = 0.75
    else:
        transport_likelihood = 0.55

    # Combine evidence likelihoods
    evidence_likelihood = (
        urgency_likelihood
        * pra_likelihood
        * transport_likelihood
    )

    # Bayesian-style update
    posterior_success = (
        prior_success * evidence_likelihood
    )

    # Normalize to probability range
    posterior_success = min(
        max(posterior_success, 0.0),
        1.0
    )

    risk_probability = 1 - posterior_success

    return {
        "success_probability": round(
            posterior_success * 100, 2
        ),
        "risk_probability": round(
            risk_probability * 100, 2
        ),
        "urgency_factor": urgency_likelihood,
        "pra_factor": pra_likelihood,
        "transport_factor": transport_likelihood
    }