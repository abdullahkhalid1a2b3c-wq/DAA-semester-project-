# Islamabad Route Network Planner (C++) 🛣️

A high-performance, full-stack route planning web application built to satisfy the **DAA (Design and Analysis of Algorithms)** Project Requirements. 

This system operates entirely on real-world OpenStreetMap data of Islamabad, Pakistan. It uses an incredibly fast custom C++ WinSock backend to execute advanced graph pathfinding algorithms (such as Bidirectional Dijkstra, A* Search, standard Dijkstra, and BFS) across hundreds of thousands of interconnected road nodes in mere milliseconds. It is accompanied by a beautifully crafted, fully-featured, animated web interface with custom themes and visual map rendering.

## 🌟 Key Features
- **Real-World Map Data:** Capable of running live shortest-path routing on real-world Islamabad geographical coordinates.
- **Advanced Authentication:** Fully secure, file-based email/password authentication system directly integrated into the C++ server. 
- **Algorithm Benchmarking:** Compare algorithms dynamically with a built-in benchmarking suite that automatically renders visually stunning charts (via Chart.js).
- **Interactive UI:** Smooth, single-page application built completely with Vanilla HTML/JS/CSS, featuring Leaflet.js map integration and real-time color theme switching!

---

## 🚀 Getting Started (For Team Members)

Follow these steps to seamlessly download the dataset, compile the backend, and launch the website on your local machine.

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   **Windows OS:** This project uses `WinSock2` for the ultra-fast C++ server, meaning it must be run on Windows.
*   **Python (3.8+)**: Required for downloading and processing the OpenStreetMap data.
*   **MinGW (g++)**: The C++ compiler needed to build the backend server.
*   **Make** (Optional but recommended): Simplifies compilation.

### 2. Clone the Repository
First, pull the code from GitHub and navigate directly into the backend directory:
```powershell
git clone <your-github-repo-url>
cd Project/backend
```

### 3. Download the Dataset
The core road network graph needs to be downloaded before running the project. We use Python and `osmnx` to grab the precise, live road network of Islamabad.

Open your terminal in the `backend/` directory (where you should be) and install the necessary Python libraries:
```powershell
pip install osmnx networkx
```
Run the extraction script to download the map data and format it into `dataset/islamabad.txt`:
```powershell
python download_islamabad.py
```
*(Note: This might take a minute depending on your internet connection!)*

### 4. Compile the C++ Backend
Compile the C++ server using the provided `Makefile`.

If you have Make installed:
```powershell
make
```
If you do not have Make installed, you can compile it manually:
```powershell
g++ -O3 -std=c++17 src/server.cpp src/graph.cpp src/algorithms.cpp -o server.exe -lws2_32
```
*(The `-O3` flag is absolutely critical to ensure algorithm execution in under 2ms!)*

### 5. Run the Web Server!
Simply execute the generated `server.exe` file, passing the downloaded dataset as an argument:
```powershell
.\server.exe --data dataset/islamabad.txt
```
The C++ server will load the massive graph into memory and automatically open your default web browser to **`http://localhost:8080/`**. 

---

## 🎨 Using the Interface
1. **Login/Signup:** Create a fresh account directly in the browser (data persists locally).
2. **Themes:** Click the `Theme` button on the home page to cycle between Blue, Green, Purple, and Dark modes!
3. **Map Planner:** Head into the main module, click anywhere on the Map to set start/end coordinates, and click `Find Route` to visually see the shortest route calculated by C++.
4. **Compare:** Click `Compare All Algorithms` to instantly benchmark Dijkstra against A* and BFS in a beautiful full-screen analytics dashboard.

Enjoy your 100/100 project! 🎉
