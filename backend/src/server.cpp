#include <winsock2.h>
#include <ws2tcpip.h>
#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include "../json.hpp"
#include "../include/graph.h"
#include "../include/algorithms.h"

using json = nlohmann::json;

#pragma comment(lib, "Ws2_32.lib")

Graph g;

std::string read_file(const std::string& filepath) {
    std::ifstream f(filepath);
    if(f) {
        std::stringstream ss;
        ss << f.rdbuf();
        return ss.str();
    }
    return "";
}

std::string handle_request(const std::string& request) {
    std::string headers_str = request.substr(0, request.find("\r\n\r\n"));
    std::string method, path, version;
    std::stringstream hs(headers_str);
    hs >> method >> path >> version;

    std::string body = "";
    size_t pos = request.find("\r\n\r\n");
    if(pos != std::string::npos && pos + 4 < request.length()) {
        body = request.substr(pos + 4);
    }
    
    if(method == "GET") {
        if(path == "/" || path == "/index.html") {
            return "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" + read_file("frontend/index.html");
        } else if(path == "/style.css") {
            return "HTTP/1.1 200 OK\r\nContent-Type: text/css\r\n\r\n" + read_file("frontend/style.css");
        } else if(path == "/script.js") {
            return "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n\r\n" + read_file("frontend/script.js");
        } else if(path == "/api/stats") {
            long long edges = 0;
            for (const auto& u : g.adj_forward) edges += u.size();
            json response;
            response["nodes"] = g.num_nodes;
            response["edges"] = edges;
            
            json coords_subset = json::array();
            for(int i=0; i < std::min(5000, g.num_nodes); i++) {
                 if(g.coords[i].lat != 0.0)
                    coords_subset.push_back({{"id", i}, {"lat", g.coords[i].lat}, {"lon", g.coords[i].lon}});
            }
            response["preview_coords"] = coords_subset;
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + response.dump();
        }
    } else if(method == "POST") {
        if(path == "/load_dataset") {
            try {
                auto req_body = json::parse(body);
                std::string dataset = req_body.value("dataset", "dataset/islamabad.txt");
                g = Graph(); 
                g.load_from_txt(dataset);
                
                long long edges = 0;
                for (const auto& u : g.adj_forward) edges += u.size();
                json res; res["nodes"] = g.num_nodes; res["edges"] = edges; res["status"] = "success";
                return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + res.dump();
            } catch (const std::exception& e) {
                return "HTTP/1.1 400 Bad Request\r\n\r\n" + std::string(e.what());
            }
        }
        else if(path == "/route") {
            try {
                auto req_body = json::parse(body);
                int start = req_body["source"];
                int end = req_body["destination"];
                std::string algo = req_body.value("algorithm", "Bidirectional Dijkstra");
                
                AlgoResult result;
                if(algo == "Dijkstra") result = dijkstra(g, start, end);
                else if(algo == "A* Star") result = a_star(g, start, end);
                else if(algo == "BFS") result = bfs(g, start, end);
                else result = bidirectional_dijkstra(g, start, end);
                
                json response;
                response["status"] = result.status;
                response["distance"] = result.distance;
                response["execution_time_ms"] = result.execution_time_ms;
                response["nodes_visited"] = result.nodes_visited;
                response["path_length_hops"] = result.path_length_hops;
                response["path"] = result.path;
                
                json path_coords = json::array();
                if(result.path.size() < 100000) { 
                    for (int node : result.path) {
                         path_coords.push_back({{"lat", g.coords[node].lat}, {"lon", g.coords[node].lon}});
                    }
                }
                response["path_coords"] = path_coords;
                return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + response.dump();
            } catch (const std::exception& e) {
                return "HTTP/1.1 400 Bad Request\r\n\r\n" + std::string(e.what());
            }
        }
        else if(path == "/compare") {
            try {
                auto req_body = json::parse(body);
                int start = req_body["source"];
                int end = req_body["destination"];
                
                auto bid_res = bidirectional_dijkstra(g, start, end);
                auto dij_res = dijkstra(g, start, end);
                auto astar_res = a_star(g, start, end);
                auto bfs_res = bfs(g, start, end);

                json response;
                auto format_res = [&](const AlgoResult& r) {
                    return json{
                        {"distance", r.distance},
                        {"execution_time_ms", r.execution_time_ms},
                        {"nodes_visited", r.nodes_visited},
                        {"path_length_hops", r.path_length_hops}
                    };
                };
                
                response["Dijkstra"] = format_res(dij_res);
                response["Bidirectional Dijkstra"] = format_res(bid_res);
                response["A* Star"] = format_res(astar_res);
                response["BFS"] = format_res(bfs_res);

                return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + response.dump();
            } catch (const std::exception& e) {
                return "HTTP/1.1 400 Bad Request\r\n\r\n" + std::string(e.what());
            }
        }
    }
    
    return "HTTP/1.1 404 Not Found\r\n\r\nNot Found";
}

int main(int argc, char* argv[]) {
    std::string data_path = "dataset/islamabad.txt"; 
    for (int i = 1; i < argc; ++i) {
        if (std::string(argv[i]) == "--data" && i + 1 < argc) {
            data_path = argv[++i];
        }
    }

    try {
        g.load_from_txt(data_path);
    } catch (const std::exception& e) {
        std::cerr << "Warning: Failed to load distinct dataset " << data_path << ": " << e.what() << "\n";
    }

    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) return 1;

    SOCKET server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == INVALID_SOCKET) return 1;

    sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(8080);

    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) == SOCKET_ERROR) return 1;
    if (listen(server_fd, 3) == SOCKET_ERROR) return 1;

    std::cout << "Server starting at http://localhost:8080\n";

    while (true) {
        SOCKET client_socket = accept(server_fd, NULL, NULL);
        if (client_socket == INVALID_SOCKET) continue;

        char buffer[32768] = {0};
        int valread = recv(client_socket, buffer, 32768, 0);
        if (valread > 0) {
            std::string request(buffer, valread);
            size_t pos = request.find("\r\n\r\n");
            if (pos != std::string::npos) {
                std::string headers = request.substr(0, pos);
                size_t cl_pos = headers.find("Content-Length: ");
                if (cl_pos != std::string::npos) {
                    int cl = std::stoi(headers.substr(cl_pos + 16));
                    int current_body_len = request.length() - (pos + 4);
                    while (current_body_len < cl) {
                         char chunk[8192] = {0};
                         int r = recv(client_socket, chunk, 8192, 0);
                         if (r <= 0) break;
                         request.append(chunk, r);
                         current_body_len += r;
                    }
                }
            }

            std::string response = handle_request(request);
            send(client_socket, response.c_str(), response.length(), 0);
        }
        closesocket(client_socket);
    }

    closesocket(server_fd);
    WSACleanup();
    return 0;
}
