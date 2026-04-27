#pragma once
#include <vector>
#include <string>
#include <utility>

struct Coord {
    double lat;
    double lon;
};

class Graph {
public:
    int num_nodes;
    std::vector<std::vector<std::pair<int, double>>> adj_forward;
    std::vector<std::vector<std::pair<int, double>>> adj_backward;
    std::vector<Coord> coords;

    Graph() : num_nodes(0) {}

    void add_edge(int u, int v, double weight);
    void load_from_txt(const std::string& filepath, int seed = 42);
    
    void resize(int n);
};
