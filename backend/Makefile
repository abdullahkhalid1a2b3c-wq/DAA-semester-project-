CXX = g++
CXXFLAGS = -O3 -std=c++14 -Wall

SRCS_MAIN = src/main.cpp src/graph.cpp src/algorithms.cpp
OBJS_MAIN = $(SRCS_MAIN:.cpp=.o)

SRCS_SERVER = src/server.cpp src/graph.cpp src/algorithms.cpp
OBJS_SERVER = $(SRCS_SERVER:.cpp=.o)

SRCS_TEST = src/tests.cpp src/graph.cpp src/algorithms.cpp
OBJS_TEST = $(SRCS_TEST:.cpp=.o)

all: main server test

main: $(OBJS_MAIN)
	$(CXX) $(CXXFLAGS) -o main $(OBJS_MAIN)
	
server: $(OBJS_SERVER)
	$(CXX) $(CXXFLAGS) -o server $(OBJS_SERVER) -lws2_32

test: $(OBJS_TEST)
	$(CXX) $(CXXFLAGS) -o test $(OBJS_TEST)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f src/*.o main.exe server.exe test.exe main server test
