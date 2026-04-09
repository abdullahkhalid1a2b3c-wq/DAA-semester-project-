import heapq
from typing import Any, Dict, List, Optional, Tuple, Set

def dijkstra(graph: Any, start: int, end: Optional[int] = None) -> Tuple[Dict[int, float], Dict[int, Optional[int]]]:
    """
    Computes shortest path from start to end.
    If end is None, computes shortest paths to all reachable nodes.
    Returns: distances dictionary, and predecessors dictionary.
    """
    distances: Dict[int, float] = {start: 0.0}
    predecessors: Dict[int, Optional[int]] = {start: None}
    pq: List[Tuple[float, int]] = [(0.0, start)]
    
    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        if end is not None and current_node == end:
            break
            
        if current_distance > distances.get(current_node, float('inf')):
            continue
            
        for neighbor, weight in graph.adj.get(current_node, []):
            distance = current_distance + weight
            
            if distance < distances.get(neighbor, float('inf')):
                distances[neighbor] = distance
                predecessors[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))
                
    return distances, predecessors

def bidirectional_dijkstra(graph: Any, start: int, end: int) -> Tuple[float, List[int]]:
    """
    Bidirectional Dijkstra's algorithm from start to end.
    Returns: distance, path
    """
    if start == end:
        return 0.0, [start]
        
    pq_f: List[Tuple[float, int]] = [(0.0, start)]
    pq_b: List[Tuple[float, int]] = [(0.0, end)]
    
    dist_f: Dict[int, float] = {start: 0.0}
    dist_b: Dict[int, float] = {end: 0.0}
    
    pred_f: Dict[int, Optional[int]] = {start: None}
    pred_b: Dict[int, Optional[int]] = {end: None}
    
    visited_f: Set[int] = set()
    visited_b: Set[int] = set()
    
    min_dist = float('inf')
    best_meeting_node = None
    
    while pq_f and pq_b:
        d_f, u_f = heapq.heappop(pq_f)
        visited_f.add(u_f)
        
        for v, weight in graph.adj.get(u_f, []):
            new_dist = d_f + weight
            if new_dist < dist_f.get(v, float('inf')):
                dist_f[v] = new_dist  # type: ignore
                pred_f[v] = u_f
                heapq.heappush(pq_f, (new_dist, v))
                if v in visited_b:
                    if new_dist + dist_b[v] < min_dist:
                        min_dist = new_dist + dist_b[v]
                        best_meeting_node = v

        d_b, u_b = heapq.heappop(pq_b)
        visited_b.add(u_b)
        
        for v, weight in graph.adj.get(u_b, []):
            new_dist = d_b + weight
            if new_dist < dist_b.get(v, float('inf')):
                dist_b[v] = new_dist  # type: ignore
                pred_b[v] = u_b
                heapq.heappush(pq_b, (new_dist, v))
                if v in visited_f:
                    if new_dist + dist_f[v] < min_dist:
                        min_dist = new_dist + dist_f[v]
                        best_meeting_node = v
                        
        if d_f + d_b >= min_dist:
            break
            
    if best_meeting_node is None:
        return float('inf'), []
        
    assert best_meeting_node is not None
        
    path = []
    curr = best_meeting_node
    while curr is not None:
        path.append(curr)
        curr = pred_f.get(curr)
    path.reverse()
    
    curr = pred_b.get(best_meeting_node)
    while curr is not None:
        path.append(curr)
        curr = pred_b.get(curr)
        
    return min_dist, path

def reconstruct_path(predecessors: Dict[int, Optional[int]], end: int) -> List[int]:
    path = []
    curr = end
    while curr is not None:
        path.append(curr)
        curr = predecessors.get(curr)
    path.reverse()
    if len(path) == 1 and path[0] != end:
        return []
    return path
