# Bi-Directional Route Planner (C++)

A high-performance route planning system implementing the Bidirectional Dijkstra algorithm on millions of nodes, satisfying the DAA Project Requirements.

## Building and Running

### Prerequisites
- `g++` compiler (MinGW on Windows, or standard GCC on Linux/macOS)
- `make`

### Installation
1. Run `./download_dataset.sh` to grab the Stanford SNAP road network dataset.
2. Run `make`

### Command Line Interface
- `main.exe --data dataset/roadNet-CA.txt --test`: Benchmarks randomly chosen node pairs on the graph.
- `main.exe --data dataset/roadNet-CA.txt --start 0 --end 10`: Manually solves the route between node 0 and node 10.

### Web Server (GUI)
1. Run `server.exe --data dataset/roadNet-CA.txt`
2. Open `http://localhost:8080/` in your web browser.
3. Use the Interface to input constraints, measure performance, compare Standard Dijkstra with Bidirectional Dijkstra, and physically view the solved paths bounding layout.

### Tests
- Run `test.exe` to run the algorithmic constraint validation framework locally ensuring mathematical path validity.
