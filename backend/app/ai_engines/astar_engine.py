import math
import heapq


def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:

    earth_radius = 6371

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius * c


def a_star_search(
    hospitals: dict,
    graph: dict,
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

            current_hospital = hospitals[current]
            neighbor_hospital = hospitals[neighbor]

            distance = calculate_distance(
                current_hospital["latitude"],
                current_hospital["longitude"],
                neighbor_hospital["latitude"],
                neighbor_hospital["longitude"]
            )

            new_cost = (
                cost_so_far[current]
                + distance
            )

            if (
                neighbor not in cost_so_far
                or new_cost < cost_so_far[neighbor]
            ):

                cost_so_far[neighbor] = new_cost

                goal_hospital = hospitals[goal]

                heuristic = calculate_distance(
                    neighbor_hospital["latitude"],
                    neighbor_hospital["longitude"],
                    goal_hospital["latitude"],
                    goal_hospital["longitude"]
                )

                priority = new_cost + heuristic

                heapq.heappush(
                    priority_queue,
                    (priority, neighbor)
                )

                came_from[neighbor] = current

    if goal not in came_from:
        return None

    path = []

    current = goal

    while current is not None:

        path.append(current)

        current = came_from[current]

    path.reverse()

    return {
        "path": path,
        "distance_km": round(
            cost_so_far[goal],
            2
        )
    }