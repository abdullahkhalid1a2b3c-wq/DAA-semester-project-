import random
import time

class Graph:
    def __init__(self):
        self.adj = {}
        
    def add_edge(self, u, v, weight):
        if u not in self.adj:
            self.adj[u] = []
        self.adj[u].append((v, weight))
        
    def load_from_txt(self, filepath, seed=42):
        print(f"Loading graph from {filepath}...")
        start_time = time.time()
        random.seed(seed)
        edges_added = 0
        added_edges_set = set()
        with open(filepath, 'r') as f:
            for line in f:
                if line.startswith('#'):
                    continue
                parts = line.strip().split()
                if len(parts) >= 2:
                    u, v = int(parts[0]), int(parts[1])
                    edge_id = (min(u, v), max(u, v))
                    if edge_id not in added_edges_set:
                        added_edges_set.add(edge_id)
                        weight = random.randint(1, 100)
                        self.add_edge(u, v, weight)
                        self.add_edge(v, u, weight)
                        edges_added += 2
        print(f"Loaded {len(self.adj)} nodes and {edges_added} edges in {time.time() - start_time:.2f} seconds.")
