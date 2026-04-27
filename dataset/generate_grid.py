import random
import os

print("Synthesizing Islamabad Road Network Grid for offline local tests...")
os.makedirs('dataset', exist_ok=True)
with open('dataset/islamabad.txt', 'w') as f:
    # 150x150 grid = 22,500 nodes
    # Mapped across 33.6 to 33.7 lat, 73.0 to 73.1 lon
    
    # Nodes
    for i in range(150):
        for j in range(150):
            id = i * 150 + j
            lat = 33.6 + (i / 150.0) * 0.1
            lon = 73.0 + (j / 150.0) * 0.1
            f.write(f"N {id} {lat} {lon}\n")
            
    edges = 0
    # Edges
    for i in range(150):
        for j in range(150):
            u = i * 150 + j
            # Right
            if j < 149:
                v = u + 1
                dist = random.uniform(30, 90)
                f.write(f"E {u} {v} {dist}\n")
                f.write(f"E {v} {u} {dist}\n")
                edges += 2
            # Down
            if i < 149:
                v = u + 150
                dist = random.uniform(30, 90)
                f.write(f"E {u} {v} {dist}\n")
                f.write(f"E {v} {u} {dist}\n")
                edges += 2
    print(f"Generated 22,500 geographic Nodes and {edges} local edges!")
    print("Done writing to dataset/islamabad.txt")
