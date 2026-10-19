from typing import List, Dict


BLOOD_COMPATIBILITY = {
    "O-": ["O-"],
    "O+": ["O+", "O-"],
    "A-": ["A-", "O-"],
    "A+": ["A+", "A-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "AB+": [
        "AB+",
        "AB-",
        "A+",
        "A-",
        "B+",
        "B-",
        "O+",
        "O-",
    ],
}


# --------------------------------------------------
# BLOOD GROUP CONSTRAINT
# --------------------------------------------------

def blood_group_compatible(
    donor_blood_group: str,
    recipient_blood_group: str
) -> bool:

    compatible_groups = BLOOD_COMPATIBILITY.get(
        recipient_blood_group,
        []
    )

    return donor_blood_group in compatible_groups


# --------------------------------------------------
# MATCH SCORE
# --------------------------------------------------

def calculate_match_score(
    organ: Dict,
    recipient: Dict
) -> float:

    score = 0.0

    # Blood group compatibility
    if blood_group_compatible(
        organ["blood_group"],
        recipient["blood_group"]
    ):
        score += 50

    # Urgency
    score += recipient["urgency_level"] * 8

    # PRA
    pra_score = max(
        0,
        20 - (recipient["pra_percentage"] / 5)
    )

    score += pra_score

    return round(score, 2)


# --------------------------------------------------
# CSP CONSTRAINTS
# --------------------------------------------------

def is_valid_assignment(
    organ: Dict,
    recipient: Dict,
    assigned_recipient_ids: List[int]
) -> bool:

    # Constraint 1:
    # Organ must be available
    if organ["status"] != "available":
        return False

    # Constraint 2:
    # Recipient must be waiting
    if recipient["status"] != "waiting":
        return False

    # Constraint 3:
    # Organ type must match
    if organ["organ_type"].lower() != recipient["organ_type"].lower():
        return False

    # Constraint 4:
    # Blood group must be compatible
    if not blood_group_compatible(
        organ["blood_group"],
        recipient["blood_group"]
    ):
        return False

    # Constraint 5:
    # A recipient cannot receive multiple organs
    if recipient["id"] in assigned_recipient_ids:
        return False

    return True


# --------------------------------------------------
# BACKTRACKING CSP
# --------------------------------------------------


def backtrack(
    organs,
    recipients,
    organ_index=0,
    current_assignment=None,
    assigned_recipient_ids=None,
    solutions=None,
):
    if current_assignment is None:
        current_assignment = []

    if assigned_recipient_ids is None:
        assigned_recipient_ids = []

    if solutions is None:
        solutions = []

    # All organs have been considered
    if organ_index >= len(organs):
        solutions.append(current_assignment.copy())
        return solutions

    current_organ = organs[organ_index]

    # Option 1: Try assigning this organ to a valid recipient
    for recipient in recipients:
        if is_valid_assignment(
            current_organ, recipient, assigned_recipient_ids
        ):
            score = calculate_match_score(current_organ, recipient)

            assignment = {
                "organ_id": current_organ["id"],
                "recipient_id": recipient["id"],
                "score": score,
            }

            current_assignment.append(assignment)
            assigned_recipient_ids.append(recipient["id"])

            backtrack(
                organs,
                recipients,
                organ_index + 1,
                current_assignment,
                assigned_recipient_ids,
                solutions,
            )

            current_assignment.pop()
            assigned_recipient_ids.pop()

    # Option 2: Skip this organ and continue with the others
    backtrack(
        organs,
        recipients,
        organ_index + 1,
        current_assignment,
        assigned_recipient_ids,
        solutions,
    )

    return solutions


# --------------------------------------------------
# FIND BEST CSP ASSIGNMENT
# --------------------------------------------------

def find_best_assignment(
    organs: List[Dict],
    recipients: List[Dict]
) -> List[Dict] | None:

    solutions = backtrack(
        organs,
        recipients
    )

    if not solutions:
        return None

    # Find the solution with the highest total score
    best_solution = max(
        solutions,
        key=lambda solution: sum(
            assignment["score"]
            for assignment in solution
        )
    )

    return best_solution