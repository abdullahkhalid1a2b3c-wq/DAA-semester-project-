import osmnx as ox
import networkx as nx
import os

def download_and_convert(place_name, output_file):
    print(f"Downloading road network for {place_name}... (this may take a few minutes)")
    
    # 1. Download the drivable road network from OpenStreetMap
    G = ox.graph_from_place(place_name, network_type='drive')
    
    # 2. Get the largest connected component so you don't get "No path found" errors for disconnected roads
    # We use networkx directly to avoid version compatibility issues with osmnx
    largest_cc = max(nx.strongly_connected_components(G), key=len)
    G = G.subgraph(largest_cc).copy()    
    print(f"Successfully downloaded {len(G.nodes)} nodes and {len(G.edges)} edges.")
    
    # 3. OSM node IDs are huge numbers (e.g. 543219876). Your C++ code uses an array, 
    # so we need to map these huge IDs to simple integers (0, 1, 2, 3...) to prevent memory crashes!
    node_mapping = {old_id: new_id for new_id, old_id in enumerate(G.nodes())}
    
    print(f"Saving dataset to {output_file}...")
    
    # Create the dataset folder if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # Write all nodes first
        for old_id, data in G.nodes(data=True):
            new_id = node_mapping[old_id]
            lat = data['y']
            lon = data['x']
            f.write(f"N {new_id} {lat} {lon}\n")
            
        # Write all edges (roads)
        for u, v, data in G.edges(data=True):
            u_id = node_mapping[u]
            v_id = node_mapping[v]
            # Use the physical road length (in meters) as the edge weight
            length = data.get('length', 1.0)
            f.write(f"E {u_id} {v_id} {length}\n")
            
    print("Done! Dataset is perfectly formatted and ready to use.")

if __name__ == "__main__":
    download_and_convert("Islamabad, Pakistan", "dataset/islamabad.txt")
