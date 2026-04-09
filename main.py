import argparse
from graph import Graph  # type: ignore
from analysis import compare_algorithms  # type: ignore
from algorithms import dijkstra, bidirectional_dijkstra, reconstruct_path  # type: ignore

def main():
    parser = argparse.ArgumentParser(description="Road-Network Route Planning")
    parser.add_argument('--data', default='dataset/roadNet-CA.txt', help='Path to dataset')
    parser.add_argument('--test', action='store_true', help='Run algorithm comparison test')
    parser.add_argument('--start', type=int, help='Start node ID')
    parser.add_argument('--end', type=int, help='End node ID')
    
    args = parser.parse_args()
    
    g = Graph()
    try:
        g.load_from_txt(args.data)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {args.data}. Please run download_dataset.py first.")
        return
        
    if args.test:
        print("\nRunning algorithm comparison...")
        compare_algorithms(g, num_tests=5)
    elif args.start is None or args.end is None:
        print("\nPlease provide both --start and --end node IDs to find a route.")
        print("Example: python main.py --start 0 --end 10")
        print("Or run the benchmark: python main.py --test")
    else:
        assert args.start is not None and args.end is not None
        start_id = int(args.start)
        end_id = int(args.end)
        print(f"\nFinding route from {start_id} to {end_id} using Bidirectional Dijkstra...")
        dist, path = bidirectional_dijkstra(g, start_id, end_id)
        if dist == float('inf'):
            print("No path found.")
        else:
            print(f"Distance: {dist}")
            print(f"Path has {len(path)} nodes. First few nodes: {path[:10]}")

if __name__ == "__main__":
    main()
