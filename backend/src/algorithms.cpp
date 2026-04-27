#include "../include/algorithms.h"
#include <queue>
#include <limits>
#include <unordered_set>
#include <algorithm>
#include <chrono>
#include <cmath>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

const double INF = std::numeric_limits<double>::infinity();

struct PQNode {
    double dist;
    int u;
    bool operator>(const PQNode& other) const {
        return dist > other.dist;
    }
};

double haversine_distance(double lat1, double lon1, double lat2, double lon2) {
    const double R = 6371000.0; // Earth radius in meters
    double dlat = (lat2 - lat1) * M_PI / 180.0;
    double dlon = (lon2 - lon1) * M_PI / 180.0;
    lat1 = lat1 * M_PI / 180.0;
    lat2 = lat2 * M_PI / 180.0;
    double a = std::pow(std::sin(dlat / 2), 2) + std::pow(std::sin(dlon / 2), 2) * std::cos(lat1) * std::cos(lat2);
    double c = 2 * std::asin(std::sqrt(a));
    return R * c;
}

std::vector<int> reconstruct_path(const std::vector<int>& predecessors, int end) {
    std::vector<int> path;
    int curr = end;
    while (curr != -1) {
        path.push_back(curr);
        curr = predecessors[curr];
    }
    std::reverse(path.begin(), path.end());
    return path;
}

AlgoResult dijkstra(const Graph& graph, int start, int end) {
    auto start_time = std::chrono::high_resolution_clock::now();
    AlgoResult res;
    res.algorithm = "Dijkstra";
    res.nodes_visited = 0;
    
    int n = graph.num_nodes;
    if(start >= n || end >= n || start < 0 || end < 0) {
        res.status = "error"; return res;
    }

    std::vector<double> dist(n, INF);
    std::vector<int> parent(n, -1);
    std::vector<bool> visited(n, false);
    
    dist[start] = 0.0;
    std::priority_queue<PQNode, std::vector<PQNode>, std::greater<PQNode>> pq;
    pq.push({0.0, start});
    
    while (!pq.empty()) {
        auto top = pq.top();
        pq.pop();
        
        int u = top.u;
        if (visited[u]) continue;
        visited[u] = true;
        res.nodes_visited++;
        
        if (u == end) break;
        
        for (const auto& edge : graph.adj_forward[u]) {
            int v = edge.first;
            double w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                parent[v] = u;
                pq.push({dist[v], v});
            }
        }
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    res.execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    
    if (dist[end] == INF) { res.status = "error"; res.distance = INF; return res; }
    
    res.status = "success";
    res.distance = dist[end];
    res.path = reconstruct_path(parent, end);
    res.path_length_hops = res.path.size() - 1;
    return res;
}

AlgoResult bidirectional_dijkstra(const Graph& graph, int start, int end) {
    auto start_time = std::chrono::high_resolution_clock::now();
    AlgoResult res;
    res.algorithm = "Bidirectional Dijkstra";
    res.nodes_visited = 0;
    
    int n = graph.num_nodes;
    if(start >= n || end >= n || start < 0 || end < 0) {
        res.status = "error"; return res;
    }
    if (start == end) {
        auto end_time = std::chrono::high_resolution_clock::now();
        res.status = "success"; res.distance = 0.0; res.path = {start}; res.path_length_hops = 0;
        res.execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
        return res;
    }
    
    std::vector<double> dist_f(n, INF), dist_b(n, INF);
    std::vector<int> parent_f(n, -1), parent_b(n, -1);
    std::vector<bool> visited_f(n, false), visited_b(n, false);
    
    dist_f[start] = 0.0;
    dist_b[end] = 0.0;
    
    std::priority_queue<PQNode, std::vector<PQNode>, std::greater<PQNode>> pq_f;
    std::priority_queue<PQNode, std::vector<PQNode>, std::greater<PQNode>> pq_b;
    pq_f.push({0.0, start});
    pq_b.push({0.0, end});
    
    double best_distance = INF;
    int meeting_node = -1;
    
    while (!pq_f.empty() && !pq_b.empty()) {
        auto top_f = pq_f.top(); pq_f.pop();
        int u_f = top_f.u;
        
        if (!visited_f[u_f]) {
            visited_f[u_f] = true;
            res.nodes_visited++;
            
            if (visited_b[u_f]) {
                if (dist_f[u_f] + dist_b[u_f] < best_distance) {
                    best_distance = dist_f[u_f] + dist_b[u_f];
                    meeting_node = u_f;
                }
            }
            
            for (const auto& edge : graph.adj_forward[u_f]) {
                int v = edge.first; double w = edge.second;
                if (dist_f[u_f] + w < dist_f[v]) {
                    dist_f[v] = dist_f[u_f] + w;
                    parent_f[v] = u_f;
                    pq_f.push({dist_f[v], v});
                }
            }
        }
        
        auto top_b = pq_b.top(); pq_b.pop();
        int u_b = top_b.u;
        
        if (!visited_b[u_b]) {
            visited_b[u_b] = true;
            res.nodes_visited++;
            
            if (visited_f[u_b]) {
                if (dist_f[u_b] + dist_b[u_b] < best_distance) {
                    best_distance = dist_f[u_b] + dist_b[u_b];
                    meeting_node = u_b;
                }
            }
            
            for (const auto& edge : graph.adj_backward[u_b]) {
                int v = edge.first; double w = edge.second;
                if (dist_b[u_b] + w < dist_b[v]) {
                    dist_b[v] = dist_b[u_b] + w;
                    parent_b[v] = u_b;
                    pq_b.push({dist_b[v], v});
                }
            }
        }
        
        double min_f = pq_f.empty() ? INF : pq_f.top().dist;
        double min_b = pq_b.empty() ? INF : pq_b.top().dist;
        
        if (best_distance <= std::min(min_f, min_b)) {
            break;
        }
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    res.execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    
    if (meeting_node == -1) { res.status = "error"; res.distance = INF; return res; }
    
    std::vector<int> path_f = reconstruct_path(parent_f, meeting_node);
    std::vector<int> path_b;
    int curr = parent_b[meeting_node];
    while (curr != -1) {
        path_b.push_back(curr);
        curr = parent_b[curr];
    }
    
    res.path = path_f;
    res.path.insert(res.path.end(), path_b.begin(), path_b.end());
    
    res.status = "success";
    res.distance = best_distance;
    res.path_length_hops = res.path.size() - 1;
    return res;
}

AlgoResult a_star(const Graph& graph, int start, int end) {
    auto start_time = std::chrono::high_resolution_clock::now();
    AlgoResult res;
    res.algorithm = "A* Star";
    res.nodes_visited = 0;
    
    int n = graph.num_nodes;
    if(start >= n || end >= n || start < 0 || end < 0) {
        res.status = "error"; return res;
    }
    
    std::vector<double> dist(n, INF);
    std::vector<int> parent(n, -1);
    std::vector<bool> visited(n, false);
    
    dist[start] = 0.0;
    std::priority_queue<PQNode, std::vector<PQNode>, std::greater<PQNode>> pq;
    double h_start = haversine_distance(graph.coords[start].lat, graph.coords[start].lon, graph.coords[end].lat, graph.coords[end].lon);
    pq.push({h_start, start});
    
    while (!pq.empty()) {
        auto top = pq.top(); pq.pop();
        int u = top.u;
        
        if (visited[u]) continue;
        visited[u] = true;
        res.nodes_visited++;
        
        if (u == end) break;
        
        for (const auto& edge : graph.adj_forward[u]) {
            int v = edge.first; double w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                parent[v] = u;
                double h = haversine_distance(graph.coords[v].lat, graph.coords[v].lon, graph.coords[end].lat, graph.coords[end].lon);
                pq.push({dist[v] + h, v});
            }
        }
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    res.execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    
    if (dist[end] == INF) { res.status = "error"; res.distance = INF; return res; }
    
    res.status = "success";
    res.distance = dist[end];
    res.path = reconstruct_path(parent, end);
    res.path_length_hops = res.path.size() - 1;
    return res;
}

AlgoResult bfs(const Graph& graph, int start, int end) {
    auto start_time = std::chrono::high_resolution_clock::now();
    AlgoResult res;
    res.algorithm = "BFS";
    res.nodes_visited = 0;
    
    int n = graph.num_nodes;
    if(start >= n || end >= n || start < 0 || end < 0) {
        res.status = "error"; return res;
    }
    
    std::vector<int> parent(n, -1);
    std::vector<bool> visited(n, false);
    std::queue<int> q;
    
    q.push(start);
    visited[start] = true;
    
    while (!q.empty()) {
        int u = q.front(); q.pop();
        res.nodes_visited++;
        
        if (u == end) break;
        
        for (const auto& edge : graph.adj_forward[u]) {
            int v = edge.first;
            if (!visited[v]) {
                visited[v] = true;
                parent[v] = u;
                q.push(v);
            }
        }
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    res.execution_time_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    
    if (!visited[end] && start != end) { res.status = "error"; res.distance = INF; return res; }
    
    res.status = "success";
    res.path = reconstruct_path(parent, end);
    res.path_length_hops = res.path.size() - 1;
    
    double total_distance = 0.0;
    for (size_t i = 0; i + 1 < res.path.size(); i++) {
        int u = res.path[i]; int v = res.path[i+1];
        for (const auto& edge : graph.adj_forward[u]) {
            if (edge.first == v) { total_distance += edge.second; break; }
        }
    }
    res.distance = total_distance;
    return res;
}
