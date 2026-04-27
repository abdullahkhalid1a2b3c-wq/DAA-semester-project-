import osmnx as ox
import os

print("Downloading real road network using OSMnx (3km radius) for true cartographic alignment...")

# Center of Islamabad
center_point = (33.71, 73.06)

# Download drive network for 3km radius (extremely fast, ~10,000 nodes)
G = ox.graph_from_point(center_point, dist=3000, network_type='drive')

nodes, edges = ox.graph_to_gdfs(G)

print(f"Extracted {len(nodes)} real-world intersections and {len(edges)} streets.")

os.makedirs('dataset', exist_ok=True)
with open('dataset/islamabad.txt', 'w') as f:
    id_map = {}
    
    for idx, (osmid, row) in enumerate(nodes.iterrows()):
        id_map[osmid] = idx
        lat = row.y
        lon = row.x
        f.write(f"N {idx} {lat} {lon}\n")
        
    for u, v, k, row in G.edges(keys=True, data=True):
        if u in id_map and v in id_map:
            weight = row.get('length', 10.0) 
            f.write(f"E {id_map[u]} {id_map[v]} {weight}\n")
            
print("Graph securely dumped to dataset/islamabad.txt! Ready to follow exact white roads.")
