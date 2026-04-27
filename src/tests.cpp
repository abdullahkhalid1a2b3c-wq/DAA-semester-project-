#include "graph.h"
#include "algorithms.h"
#include <iostream>
#include <cassert>
#include <cmath>

void assert_float_eq(float a, float b) {
    if (std::isinf(a) && std::isinf(b)) return;
    assert(std::abs(a - b) < 1e-4);
}

int main() {
    std::cout << "Running unit tests...\n";

    // 1. Straight Line Graph
    // 0 -1-> 1 -2-> 2 -3-> 3
    Graph g1;
    g1.add_edge(0, 1, 1.0f); g1.add_edge(1, 0, 1.0f);
    g1.add_edge(1, 2, 2.0f); g1.add_edge(2, 1, 2.0f);
    g1.add_edge(2, 3, 3.0f); g1.add_edge(3, 2, 3.0f);

    auto res1_std = dijkstra(g1, 0, 3, true);
    auto res1_bid = bidirectional_dijkstra(g1, 0, 3);
    assert_float_eq(res1_std.distance, 6.0f);
    assert_float_eq(res1_bid.distance, 6.0f);

    // 2. Disconnected Graph
    // 0 -1-> 1    2 -1-> 3
    Graph g2;
    g2.add_edge(0, 1, 1.0f); g2.add_edge(1, 0, 1.0f);
    g2.add_edge(2, 3, 1.0f); g2.add_edge(3, 2, 1.0f);
    
    auto res2_std = dijkstra(g2, 0, 3, true);
    auto res2_bid = bidirectional_dijkstra(g2, 0, 3);
    assert(std::isinf(res2_std.distance));
    assert(std::isinf(res2_bid.distance));

    // 3. Same Node
    Graph g3;
    g3.add_edge(0, 1, 1.0f); g3.add_edge(1, 0, 1.0f);
    auto res3_bid = bidirectional_dijkstra(g3, 1, 1);
    assert_float_eq(res3_bid.distance, 0.0f);

    std::cout << "All automated tests passed successfully!\n";
    return 0;
}
