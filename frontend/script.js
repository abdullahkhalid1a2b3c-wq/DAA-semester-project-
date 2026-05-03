let map;
let pathLayer;
let startMarker;
let endMarker;
let currentChart;

let nodeCoords = {}; 
let coordNodes = [];

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active-screen');
        s.classList.add('hidden');
    });
    const s = document.getElementById(screenId);
    s.classList.remove('hidden');
    s.classList.add('active-screen');
    
    // Resize map when planner becomes visible
    if(screenId === 'planner-screen' && map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function switchAuthCard(cardId) {
    document.querySelectorAll('.auth-card').forEach(c => {
        c.classList.add('hidden');
    });
    document.getElementById(cardId).classList.remove('hidden');
    document.querySelectorAll('.error-text').forEach(e => e.classList.add('hidden'));
}

function showAuthError(cardPrefix, msg) {
    const err = document.getElementById(cardPrefix + '-error');
    if(msg) { err.innerText = msg; err.classList.remove('hidden'); }
    else err.classList.add('hidden');
}

// Auth Handlers
document.getElementById('login-submit-btn').addEventListener('click', async () => {
    let e = document.getElementById('login-email').value;
    let p = document.getElementById('login-pass').value;
    if(!e || !p) return showAuthError('login', 'Please fill all fields');
    
    try {
        let res = await fetch('/api/login', {
            method: 'POST', body: JSON.stringify({email: e, password: p})
        });
        let data = await res.json();
        if(res.ok && data.status === 'success') {
            showAuthError('login', '');
            showScreen('home-screen');
        } else {
            showAuthError('login', data.error || 'Login failed');
        }
    } catch(err) { showAuthError('login', 'Server error'); }
});

document.getElementById('signup-submit-btn').addEventListener('click', async () => {
    let e = document.getElementById('signup-email').value;
    let u = document.getElementById('signup-user').value;
    let p = document.getElementById('signup-pass').value;
    if(!e || !u || !p) return showAuthError('signup', 'Please fill all fields');
    
    try {
        let res = await fetch('/api/signup', {
            method: 'POST', body: JSON.stringify({email: e, username: u, password: p})
        });
        let data = await res.json();
        if(res.ok && data.status === 'success') {
            showAuthError('signup', '');
            showScreen('home-screen');
        } else {
            showAuthError('signup', data.error || 'Signup failed');
        }
    } catch(err) { showAuthError('signup', 'Server error'); }
});

document.getElementById('reset-submit-btn').addEventListener('click', async () => {
    let e = document.getElementById('reset-email').value;
    let u = document.getElementById('reset-user').value;
    let p = document.getElementById('reset-pass').value;
    if(!e || !u || !p) return showAuthError('reset', 'Please fill all fields');
    
    try {
        let res = await fetch('/api/reset_password', {
            method: 'POST', body: JSON.stringify({email: e, username: u, new_password: p})
        });
        let data = await res.json();
        if(res.ok && data.status === 'success') {
            showAuthError('reset', '');
            alert("Password reset successfully! Please login.");
            switchAuthCard('login-card');
        } else {
            showAuthError('reset', data.error || 'Reset failed');
        }
    } catch(err) { showAuthError('reset', 'Server error'); }
});

// Home Handlers
document.getElementById('nav-planner-btn').addEventListener('click', () => {
    showScreen('planner-screen');
});
document.getElementById('nav-help-btn').addEventListener('click', () => {
    showScreen('help-screen');
});
document.getElementById('nav-logout-btn').addEventListener('click', () => {
    document.getElementById('login-email').value = '';
    document.getElementById('login-pass').value = '';
    switchAuthCard('login-card');
    showScreen('login-screen');
});
document.getElementById('back-home-help-btn').addEventListener('click', () => {
    showScreen('home-screen');
});
document.getElementById('back-home-btn').addEventListener('click', () => {
    showScreen('home-screen');
});
// Theme Handlers
const themes = [
    { id: 'blue', name: 'Default Blue' },
    { id: 'green', name: 'Emerald Green' },
    { id: 'purple', name: 'Royal Purple' },
    { id: 'dark', name: 'Slate Dark' }
];
let currentThemeIndex = 0;

function applyTheme(index) {
    currentThemeIndex = index;
    const theme = themes[index];
    if (theme.id === 'blue') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme.id);
    }
    document.getElementById('theme-text').innerText = `Theme: ${theme.name}`;
    localStorage.setItem('app-theme', index);
}

document.getElementById('theme-btn').addEventListener('click', () => {
    let nextIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(nextIndex);
});

let savedTheme = localStorage.getItem('app-theme');
if (savedTheme !== null) applyTheme(parseInt(savedTheme));


// Map logic
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
            initMap(33.6844, 73.0479);
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
        showScreen('compare-screen');
        renderChart(data);
        generateReport(data);
    } catch(e) { showError(e.message); }
    showLoading(false);
});

function generateReport(data) {
    let algos = Object.keys(data);
    if (algos.length === 0) return;

    let bestTimeAlgo = algos[0];
    let worstTimeAlgo = algos[0];
    let bestNodesAlgo = algos[0];
    
    let validAlgos = algos.filter(a => data[a].distance > 0);
    let minDistance = validAlgos.length > 0 ? Math.min(...validAlgos.map(a => data[a].distance)) : 0;
    let optimalAlgos = validAlgos.filter(a => Math.abs(data[a].distance - minDistance) < 0.01);
    
    algos.forEach(a => {
        if(data[a].execution_time_ms < data[bestTimeAlgo].execution_time_ms) bestTimeAlgo = a;
        if(data[a].execution_time_ms > data[worstTimeAlgo].execution_time_ms) worstTimeAlgo = a;
        if(data[a].nodes_visited < data[bestNodesAlgo].nodes_visited) bestNodesAlgo = a;
    });
    
    let timeImprovement = 0;
    if (data[worstTimeAlgo].execution_time_ms > 0) {
        timeImprovement = ((data[worstTimeAlgo].execution_time_ms - data[bestTimeAlgo].execution_time_ms) / data[worstTimeAlgo].execution_time_ms) * 100;
    }
    
    let reportHtml = `<strong>Academic Summary:</strong><br>`;

    if (optimalAlgos.length > 0) {
        if (optimalAlgos.length === validAlgos.length && validAlgos.length > 1) {
            reportHtml += `All algorithms successfully found the same optimal shortest path distance of <strong>${minDistance.toFixed(2)}m</strong>.<br><br>`;
        } else {
            reportHtml += `The optimal shortest path distance of <strong>${minDistance.toFixed(2)}m</strong> was found by: <strong>${optimalAlgos.join(', ')}</strong>.<br><br>`;
        }
    }

    reportHtml += `The fastest algorithm was <strong>${bestTimeAlgo}</strong>, completing in just ${data[bestTimeAlgo].execution_time_ms.toFixed(2)}ms.<br>
    It was approximately ${timeImprovement.toFixed(1)}% faster than ${worstTimeAlgo}.<br>
    The algorithm that explored the fewest nodes was <strong>${bestNodesAlgo}</strong>, visiting only ${data[bestNodesAlgo].nodes_visited.toLocaleString()} nodes.`;
    
    document.getElementById('comparison-report').innerHTML = reportHtml;
}

document.getElementById('back-planner-btn').addEventListener('click', () => {
    showScreen('planner-screen');
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
