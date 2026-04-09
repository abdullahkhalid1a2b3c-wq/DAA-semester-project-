import time
import random
from algorithms import dijkstra, bidirectional_dijkstra  # type: ignore

def compare_algorithms(graph, num_tests=10, seed=42):
    random.seed(seed)
    nodes = list(graph.adj.keys())
    
    if not nodes:
        print("Graph is empty!")
        return

    print(f"{'Source':<10} {'Target':<10} {'Dijkstra Dist':<15} {'Bi-Dir Dist':<15} {'Dijkstra Time(s)':<18} {'Bi-Dir Time(s)':<18}")
    print("-" * 90)
    
    total_dijkstra_time = 0
    total_bidir_time = 0
    
    for _ in range(num_tests):
        start = random.choice(nodes)
        end = random.choice(nodes)
        
        # Test Dijkstra
        t0 = time.time()
        d_dist, d_pred = dijkstra(graph, start, end)
        t_d = time.time() - t0
        dist_val = d_dist.get(end, float('inf'))
        total_dijkstra_time += t_d
        
        # Test Bidirectional
        t0 = time.time()
        b_dist, b_path = bidirectional_dijkstra(graph, start, end)
        t_b = time.time() - t0
        total_bidir_time += t_b
        
        print(f"{start:<10} {end:<10} {dist_val:<15} {b_dist:<15} {t_d:<18.4f} {t_b:<18.4f}")
        
    print("-" * 90)
    print(f"Average Dijkstra time:     {total_dijkstra_time/num_tests:.4f} s")
    print(f"Average Bidirectional time:{total_bidir_time/num_tests:.4f} s")
