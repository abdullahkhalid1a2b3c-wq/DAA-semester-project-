#include "analysis.h"
#include "algorithms.h"
#include <iostream>
#include <iomanip>
#include <random>
#include <chrono>
#include <vector>

void compare_algorithms(const Graph& graph, int num_tests, int seed) {
    if (graph.adj.empty()) {
        std::cout << "Graph is empty!\n";
        return;
    }
    
    std::mt19937 gen(seed);
    std::vector<int> nodes;
    for (const auto& pair : graph.adj) {
        nodes.push_back(pair.first);
    }
    
    std::uniform_int_distribution<> distrib(0, nodes.size() - 1);
    
    std::cout << std::left << std::setw(10) << "Source" 
              << std::setw(10) << "Target" 
              << std::setw(15) << "Dijkstra Dist" 
              << std::setw(15) << "Bi-Dir Dist" 
              << std::setw(18) << "Dijkstra Time(s)" 
              << std::setw(18) << "Bi-Dir Time(s)\n";
              
    std::cout << std::string(90, '-') << "\n";
    
    double total_dijkstra_time = 0.0;
    double total_bidir_time = 0.0;
    
    for (int i = 0; i < num_tests; ++i) {
        int start = nodes[distrib(gen)];
        int end = nodes[distrib(gen)];
        
        auto d_res = dijkstra(graph, start, end, true);
        float dist_val = d_res.distance;
        total_dijkstra_time += d_res.execution_time_ms / 1000.0;
        
        auto b_res = bidirectional_dijkstra(graph, start, end);
        total_bidir_time += b_res.execution_time_ms / 1000.0;
        
        std::cout << std::left << std::setw(10) << start 
                  << std::setw(10) << end 
                  << std::setw(15) << dist_val 
                  << std::setw(15) << b_res.distance
                  << std::setw(18) << std::fixed << std::setprecision(4) << (d_res.execution_time_ms / 1000.0) 
                  << std::setw(18) << std::fixed << std::setprecision(4) << (b_res.execution_time_ms / 1000.0) << "\n";
    }
    
    std::cout << std::string(90, '-') << "\n";
    std::cout << "Average Dijkstra time:     " << std::fixed << std::setprecision(4) << (total_dijkstra_time / num_tests) << " s\n";
    std::cout << "Average Bidirectional time:" << std::fixed << std::setprecision(4) << (total_bidir_time / num_tests) << " s\n";
}
