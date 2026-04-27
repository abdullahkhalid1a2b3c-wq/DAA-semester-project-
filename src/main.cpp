#include "graph.h"
#include "algorithms.h"
#include "analysis.h"
#include <iostream>
#include <string>
#include <limits>

int main(int argc, char* argv[]) {
    std::string data_path = "dataset/roadNet-CA.txt";
    bool run_test = false;
    int start_node = -1;
    int end_node = -1;
    
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--data" && i + 1 < argc) {
            data_path = argv[++i];
        } else if (arg == "--test") {
            run_test = true;
        } else if (arg == "--start" && i + 1 < argc) {
            start_node = std::stoi(argv[++i]);
        } else if (arg == "--end" && i + 1 < argc) {
            end_node = std::stoi(argv[++i]);
        }
    }
    
    Graph g;
    try {
        g.load_from_txt(data_path);
    } catch (const std::exception& e) {
        std::cerr << "Error: Dataset not found at " << data_path << ". Please run dataset download first.\n";
        return 1;
    }
    
    if (run_test) {
        std::cout << "\nRunning algorithm comparison...\n";
        compare_algorithms(g, 5);
    } else if (start_node == -1 || end_node == -1) {
        std::cout << "\nPlease provide both --start and --end node IDs to find a route.\n";
        std::cout << "Example: ./main --start 0 --end 10\n";
        std::cout << "Or run the benchmark: ./main --test\n";
    } else {
        std::cout << "\nFinding route from " << start_node << " to " << end_node << " using Bidirectional Dijkstra...\n";
        auto result = bidirectional_dijkstra(g, start_node, end_node);
        float dist = result.distance;
        auto path = result.path;
        
        if (dist == std::numeric_limits<float>::infinity()) {
            std::cout << "No path found.\n";
        } else {
            std::cout << "Distance: " << dist << "\n";
            std::cout << "Path has " << path.size() << " nodes. First few nodes: [";
            for (size_t i = 0; i < std::min(path.size(), (size_t)10); ++i) {
                std::cout << path[i] << (i + 1 < path.size() && i < 9 ? ", " : "");
            }
            std::cout << "]\n";
        }
    }
    
    return 0;
}
