#pragma once
#include "../include/graph.h"
#include <vector>
#include <string>

struct AlgoResult {
    double distance;
    std::vector<int> path;
    long long nodes_visited;
    double execution_time_ms;
    std::string status;
    int path_length_hops;
    std::string algorithm;
};

double haversine_distance(double lat1, double lon1, double lat2, double lon2);

AlgoResult dijkstra(const Graph& graph, int start, int end);
AlgoResult bidirectional_dijkstra(const Graph& graph, int start, int end);
AlgoResult a_star(const Graph& graph, int start, int end);
AlgoResult bfs(const Graph& graph, int start, int end);
