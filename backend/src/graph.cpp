#include "../include/graph.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <random>
#include <chrono>
#include <algorithm>

void Graph::resize(int n) {
    if (n > num_nodes) {
        num_nodes = n;
        adj_forward.resize(n);
        adj_backward.resize(n);
        coords.resize(n, {0.0, 0.0});
    }
}

void Graph::add_edge(int u, int v, double weight) {
    int max_node = std::max(u, v) + 1;
    resize(max_node);
    adj_forward[u].push_back({v, weight});
    adj_backward[v].push_back({u, weight});
}

void Graph::load_from_txt(const std::string& filepath, int seed) {
    std::cout << "Loading graph from " << filepath << "..." << std::endl;
    auto start_time = std::chrono::high_resolution_clock::now();
    
    std::mt19937 gen(seed);
    std::uniform_real_distribution<double> distrib_w(1.0, 100.0);
    // Bounding box for synthetic coordinates (California approx)
    std::uniform_real_distribution<double> distrib_lat(32.0, 42.0);
    std::uniform_real_distribution<double> distrib_lon(-124.0, -114.0);

    std::ifstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open file");
    }

    std::string line;
    long long edges_added = 0;
    
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;
        std::stringstream ss(line);
        char type;
        if (line[0] == 'N') {
            int u; double lat, lon;
            ss >> type >> u >> lat >> lon;
            resize(u + 1);
            coords[u] = {lat, lon};
        } else if (line[0] == 'E') {
            int u, v; double w;
            ss >> type >> u >> v >> w;
            add_edge(u, v, w);
            edges_added++;
        } else {
            // standard edge list fallback
            int u, v;
            if (ss >> u >> v) {
                double w = distrib_w(gen);
                add_edge(u, v, w);
                add_edge(v, u, w);
                edges_added += 2;
                
                // Assign synthetic coords if empty
                if (coords[u].lat == 0.0) coords[u] = {distrib_lat(gen), distrib_lon(gen)};
                if (coords[v].lat == 0.0) coords[v] = {distrib_lat(gen), distrib_lon(gen)};
            }
        }
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> diff = end_time - start_time;
    
    std::cout << "Loaded " << num_nodes << " nodes and " << edges_added 
              << " edges in " << diff.count() << " seconds.\n";
}
