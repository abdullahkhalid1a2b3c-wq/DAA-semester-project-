let map;
let pathLayer;
let startMarker;
let endMarker;
let currentChart;

let nodeCoords = {}; // id -> {lat, lon}
let coordNodes = []; // array of {id, lat, lon} for spatial search

function initMap(centerLat, centerLon) {
    if (map) return;
    map = L.map('map').setView([centerLat, centerLon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    map.on('click', onMapClick);
}

function onMapClick(e) {
    let lat = e.latlng.lat;
    let lon = e.latlng.lng;
    
    // Find nearest node
    let bestNode = -1;
    let bestDist = Infinity;
    
    for (let cn of coordNodes) {
        let d = Math.pow(cn.lat - lat, 2) + Math.pow(cn.lon - lon, 2);
        if (d < bestDist) {
            bestDist = d;
            bestNode = cn.id;
        }
    }
    
    if (bestNode === -1) return;
    
    let startInput = document.getElementById('start-node');
    let endInput = document.getElementById('end-node');
    
    if (!startInput.value) {
        startInput.value = bestNode;
        updateMarkers();
    } else if (!endInput.value) {
        endInput.value = bestNode;
        updateMarkers();
    } else {
        startInput.value = bestNode;
        endInput.value = '';
        updateMarkers();
    }
}

function updateMarkers() {
    let s = document.getElementById('start-node').value;
    let e = document.getElementById('end-node').value;
    
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    
    if (s && nodeCoords[s]) {
        startMarker = L.circleMarker([nodeCoords[s].lat, nodeCoords[s].lon], {
            color: '#4ade80', radius: 8, fillOpacity: 1
        }).addTo(map).bindPopup("Source: " + s);
    }
    
    if (e && nodeCoords[e]) {
        endMarker = L.circleMarker([nodeCoords[e].lat, nodeCoords[e].lon], {
            color: '#f87171', radius: 8, fillOpacity: 1
        }).addTo(map).bindPopup("Destination: " + e);
    }
}

document.getElementById('start-node').addEventListener('change', updateMarkers);
document.getElementById('end-node').addEventListener('change', updateMarkers);

document.getElementById('swap-btn').addEventListener('click', () => {
    let s = document.getElementById('start-node').value;
    document.getElementById('start-node').value = document.getElementById('end-node').value;
    document.getElementById('end-node').value = s;
    updateMarkers();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    document.getElementById('start-node').value = '';
    document.getElementById('end-node').value = '';
    if (pathLayer) map.removeLayer(pathLayer);
    document.getElementById('results-panel').classList.add('hidden');
    document.getElementById('compare-panel').classList.add('hidden');
    updateMarkers();
});

async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('graph-stats').innerHTML = 
            `Nodes: <strong>${data.nodes.toLocaleString()}</strong><br>
             Edges: <strong>${data.edges.toLocaleString()}</strong>`;
             
        if (data.preview_coords && data.preview_coords.length > 0) {
            coordNodes = data.preview_coords;
            for (let cn of coordNodes) nodeCoords[cn.id] = {lat: cn.lat, lon: cn.lon};
            initMap(coordNodes[0].lat, coordNodes[0].lon);
        } else {
            initMap(33.6844, 73.0479); // default islamabad
        }
    } catch (e) {
        document.getElementById('graph-stats').innerText = "Failed to load stats.";
        initMap(33.6844, 73.0479);
    }
}

function showLoading(show) { document.getElementById('loading').classList.toggle('hidden', !show); }
function showError(msg) {
    const err = document.getElementById('error-msg');
    if (msg) { err.innerText = msg; err.classList.remove('hidden'); }
    else err.classList.add('hidden');
}

document.getElementById('find-path-btn').addEventListener('click', async () => {
    let start = parseInt(document.getElementById('start-node').value);
    let end = parseInt(document.getElementById('end-node').value);
    let algo = document.getElementById('algo-select').value;
    
    if (isNaN(start) || isNaN(end)) return showError("Please select Source and Destination.");
    
    document.getElementById('results-panel').classList.add('hidden');
    document.getElementById('compare-panel').classList.add('hidden');
    if (pathLayer) map.removeLayer(pathLayer);
    showError(null); showLoading(true);
    
    try {
        let res = await fetch('/route', {
            method: 'POST',
            body: JSON.stringify({source: start, destination: end, algorithm: algo})
        });
        
        let data = await res.json();
        if (data.status === "error" || !data.path || data.path.length === 0) {
            showError("No path exists between these nodes or disconnected.");
        } else {
            document.getElementById('res-algo').innerText = algo;
            document.getElementById('res-distance').innerText = data.distance.toFixed(2);
            document.getElementById('res-length').innerText = data.path_length_hops;
            document.getElementById('res-time').innerText = data.execution_time_ms.toFixed(2);
            document.getElementById('res-visited').innerText = data.nodes_visited.toLocaleString();
            document.getElementById('results-panel').classList.remove('hidden');
            
            // Draw path
            let latlngs = data.path_coords.map(c => [c.lat, c.lon]);
            if (latlngs.length > 0) {
                pathLayer = L.polyline(latlngs, {color: '#3b82f6', weight: 4, opacity: 0.8}).addTo(map);
                map.fitBounds(pathLayer.getBounds(), {padding: [50, 50]});
            }
        }
    } catch (e) { showError(e.message); }
    showLoading(false);
});

document.getElementById('compare-btn').addEventListener('click', async () => {
    let start = parseInt(document.getElementById('start-node').value);
    let end = parseInt(document.getElementById('end-node').value);
    
    if (isNaN(start) || isNaN(end)) return showError("Please select Source and Destination.");
    
    document.getElementById('results-panel').classList.add('hidden');
    if (pathLayer) map.removeLayer(pathLayer);
    showError(null); showLoading(true);
    
    try {
        let res = await fetch('/compare', {
            method: 'POST',
            body: JSON.stringify({source: start, destination: end})
        });
        
        let data = await res.json();
        document.getElementById('compare-panel').classList.remove('hidden');
        renderChart(data);
    } catch(e) { showError(e.message); }
    showLoading(false);
});

function renderChart(data) {
    const ctx = document.getElementById('compare-chart').getContext('2d');
    if (currentChart) currentChart.destroy();
    
    let labels = Object.keys(data);
    let times = labels.map(l => data[l].execution_time_ms);
    let nodes = labels.map(l => data[l].nodes_visited);
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Nodes Visited',
                    data: nodes,
                    backgroundColor: 'rgba(56, 189, 248, 0.7)',
                    yAxisID: 'y'
                },
                {
                    label: 'Time (ms)',
                    data: times,
                    backgroundColor: 'rgba(74, 222, 128, 0.7)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: {display: true, text: 'Nodes', color: '#94a3b8'} },
                y1: { type: 'linear', display: true, position: 'right', grid: {drawOnChartArea: false}, title: {display: true, text: 'Time (ms)', color: '#94a3b8'} },
                x: { ticks: {color: '#94a3b8'} }
            },
            plugins: {
                legend: { labels: {color: '#f8fafc'} }
            }
        }
    });
}

setTimeout(loadStats, 500);
