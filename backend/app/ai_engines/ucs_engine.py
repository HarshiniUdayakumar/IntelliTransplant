import heapq


def uniform_cost_search(
    graph: dict,
    edge_costs: dict,
    start: int,
    goal: int
):
    priority_queue = []

    heapq.heappush(
        priority_queue,
        (0, start)
    )

    came_from = {
        start: None
    }

    cost_so_far = {
        start: 0
    }

    while priority_queue:

        current_cost, current = heapq.heappop(
            priority_queue
        )

        if current == goal:
            break

        for neighbor in graph.get(current, []):

            edge = (current, neighbor)

            cost = edge_costs.get(
                edge,
                float("inf")
            )

            new_cost = (
                cost_so_far[current]
                + cost
            )

            if (
                neighbor not in cost_so_far
                or new_cost < cost_so_far[neighbor]
            ):

                cost_so_far[neighbor] = new_cost

                heapq.heappush(
                    priority_queue,
                    (new_cost, neighbor)
                )

                came_from[neighbor] = current

    if goal not in came_from:
        return None

    # -----------------------------------------
    # Reconstruct path
    # -----------------------------------------

    path = []

    current = goal

    while current is not None:

        path.append(current)

        current = came_from[current]

    path.reverse()

    return {
        "path": path,
        "cost": round(
            cost_so_far[goal],
            2
        )
    }