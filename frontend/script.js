let map;
let pathLayer;
let startMarker;
let endMarker;
let currentChart;

let nodeCoords = {}; 
let coordNodes = [];

let mapPlaces;
let pathLayerPlaces;
let placeMarkers = [];
let intermediateStopCount = 0;
let lastScreen = 'home-screen';

function getThemeColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--btn-primary').trim() || '#2563eb';
}

// Screen Management
function showScreen(screenId) {
    // Determine the current screen before switching
    const current = document.querySelector('.screen.active-screen');
    if (current && !['compare-screen', 'help-screen'].includes(current.id)) {
        lastScreen = current.id;
    }

    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active-screen');
        s.classList.add('hidden');
    });
    const s = document.getElementById(screenId);
    s.classList.remove('hidden');
    s.classList.add('active-screen');
    
    // Resize maps when screens become visible
    if(screenId === 'planner-screen') {
        if(map) [100, 300, 500].forEach(delay => setTimeout(() => map.invalidateSize(), delay));
    }
    if(screenId === 'places-planner-screen') {
        if(!mapPlaces) initMapPlaces(33.6844, 73.0479);
        if(mapPlaces) [100, 300, 500].forEach(delay => setTimeout(() => mapPlaces.invalidateSize(), delay));
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
document.getElementById('nav-places-btn').addEventListener('click', () => {
    showScreen('places-planner-screen');
});
document.getElementById('back-home-places-btn').addEventListener('click', () => {
    showScreen('home-screen');
});
document.getElementById('back-to-planner-btn').addEventListener('click', () => {
    showScreen(lastScreen);
});

// Helper for Search suggestions
function debounce(func, timeout = 300){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

async function fetchSuggestions(query, box) {
    if(!query || query.length < 3) {
        box.classList.add('hidden');
        return;
    }
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Islamabad")}&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        box.innerHTML = '';
        if(data.length === 0) {
            box.classList.add('hidden');
            return;
        }
        data.forEach(place => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerText = place.display_name;
            div.onclick = () => {
                const input = box.previousElementSibling;
                input.value = place.display_name;
                input.dataset.lat = place.lat;
                input.dataset.lon = place.lon;
                box.classList.add('hidden');
            };
            box.appendChild(div);
        });
        box.classList.remove('hidden');
    } catch(err) { console.error(err); }
}

const debounceFetchSuggestions = debounce((q, b) => fetchSuggestions(q, b), 400);

document.addEventListener('input', (e) => {
    if(e.target.classList.contains('place-search-input')) {
        const box = e.target.nextElementSibling;
        debounceFetchSuggestions(e.target.value, box);
    }
});

document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-input-wrapper')) {
        document.querySelectorAll('.suggestions-box').forEach(box => box.classList.add('hidden'));
    }
});

// Add Stop Logic
document.getElementById('add-stop-btn').addEventListener('click', () => {
    intermediateStopCount++;
    const container = document.getElementById('stops-container');
    const destGroup = document.getElementById('destination-group');
    
    const newStop = document.createElement('div');
    newStop.className = 'search-group';
    newStop.innerHTML = `
        <label style="font-size: 0.8rem; font-weight: 700; color: #8b5cf6; text-transform: uppercase; display:block; margin-bottom:0.4rem;">Intermediate Stop ${intermediateStopCount}</label>
        <div class="search-input-wrapper" style="position:relative;">
            <input type="text" class="place-search-input" placeholder="Enter stop landmark..." data-type="stop" style="width:100%; padding:0.8rem; border:1px solid #e2e8f0; border-radius:8px;">
            <div class="suggestions-box hidden"></div>
            <button class="remove-stop-btn" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    container.insertBefore(newStop, destGroup);
});

async function geocodeDirectly(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Islamabad")}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        return data.length > 0 ? {lat: data[0].lat, lon: data[0].lon} : null;
    } catch { return null; }
}

async function findNearestNode(lat, lon) {
    try {
        const res = await fetch(`/api/nearest?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        return data.id;
    } catch { return -1; }
}

function showPlacesLoading(show) {
    document.getElementById('places-loading').classList.toggle('hidden', !show);
}
function showPlacesError(msg) {
    const err = document.getElementById('places-error');
    if(msg) { err.innerText = msg; err.classList.remove('hidden'); }
    else err.classList.add('hidden');
}

function initMapPlaces(lat, lon) {
    if (mapPlaces) return;
    mapPlaces = L.map('map-places').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapPlaces);
    pathLayerPlaces = L.layerGroup().addTo(mapPlaces);
}

document.getElementById('clear-places-btn').addEventListener('click', () => {
    document.querySelectorAll('.place-search-input').forEach(i => i.value = '');
    document.getElementById('places-results').classList.add('hidden');
    pathLayerPlaces.clearLayers();
    placeMarkers.forEach(m => mapPlaces.removeLayer(m));
    placeMarkers = [];
});

document.getElementById('find-place-route-btn').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('.place-search-input');
    const waypoints = [];
    showPlacesLoading(true);
    showPlacesError("");
    
    for(let input of inputs) {
        if(!input.dataset.lat || !input.dataset.lon) {
            if(input.value) {
                const geo = await geocodeDirectly(input.value);
                if(geo) waypoints.push({lat: parseFloat(geo.lat), lon: parseFloat(geo.lon), name: input.value});
                else { showPlacesError(`Could not find location: ${input.value}`); showPlacesLoading(false); return; }
            } else { showPlacesError("Please fill all location fields"); showPlacesLoading(false); return; }
        } else {
            waypoints.push({lat: parseFloat(input.dataset.lat), lon: parseFloat(input.dataset.lon), name: input.value});
        }
    }
    
    if(waypoints.length < 2) { showPlacesLoading(false); return; }
    
    const nodeIds = [];
    for(let wp of waypoints) {
        const id = await findNearestNode(wp.lat, wp.lon);
        if(id !== -1) nodeIds.push(id);
    }
    
    const selectedAlgo = document.getElementById('algo-select-places').value;
    
    let fullPath = [];
    let totalDist = 0;
    
    for(let i = 0; i < nodeIds.length - 1; i++) {
        try {
            let res = await fetch('/route', {
                method: 'POST',
                body: JSON.stringify({source: nodeIds[i], destination: nodeIds[i+1], algorithm: selectedAlgo})
            });
            let seg = await res.json();
            if(!seg || seg.distance === -1) {
                showPlacesError(`No road path found between stop ${i+1} and ${i+2}`);
                showPlacesLoading(false);
                return;
            }
            fullPath = fullPath.concat(seg.path_coords);
            totalDist += seg.distance;
        } catch(e) { showPlacesError("Server connection failed"); showPlacesLoading(false); return; }
    }
    
    renderPlacesPath(fullPath, waypoints);
    
    document.getElementById('places-results').classList.remove('hidden');
    document.getElementById('places-res-content').innerHTML = `
        <p><b>Algorithm:</b> ${selectedAlgo}</p>
        <p><b>Total Distance:</b> ${(totalDist/1000).toFixed(2)} km</p>
        <p><b>Est. Drive Time:</b> ${Math.ceil((totalDist/13.8))} seconds</p>
        <p><b>Route Stops:</b> ${waypoints.length}</p>
    `;
    showPlacesLoading(false);
});

document.getElementById('compare-places-btn').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('.place-search-input');
    const startInput = inputs[0];
    const endInput = inputs[inputs.length - 1];
    
    if(!startInput.dataset.lat || !endInput.dataset.lat) {
        showPlacesError("Please select at least a Start and Destination from suggestions to compare.");
        return;
    }
    
    showPlacesLoading(true);
    showPlacesError("");
    
    const startNode = await findNearestNode(parseFloat(startInput.dataset.lat), parseFloat(startInput.dataset.lon));
    const endNode = await findNearestNode(parseFloat(endInput.dataset.lat), parseFloat(endInput.dataset.lon));
    
    if(startNode === -1 || endNode === -1) {
        showPlacesError("Could not snap places to road network.");
        showPlacesLoading(false);
        return;
    }
    try {
        let res = await fetch('/compare', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({source: startNode, destination: endNode})
        });
        if (!res.ok) throw new Error("Server error");
        let data = await res.json();
        
        // Show the chart and report
        renderChart(data);
        generateReport(data);
        showScreen('compare-screen');
    } catch(e) { 
        console.error(e);
        showPlacesError("Comparison failed: Check if nodes are connected."); 
    }
    showPlacesLoading(false);
});

function renderPlacesPath(pathCoords, waypoints) {
    pathLayerPlaces.clearLayers();
    placeMarkers.forEach(m => mapPlaces.removeLayer(m));
    placeMarkers = [];

    const latlngs = pathCoords.map(c => [c.lat, c.lon]);
    if (latlngs.length > 0) {
        const poly = L.polyline(latlngs, {
            color: getThemeColor(), 
            weight: 6, 
            opacity: 0.9,
            lineJoin: 'round'
        }).addTo(pathLayerPlaces);
        mapPlaces.fitBounds(poly.getBounds(), {padding: [50, 50]});
    }

    waypoints.forEach((wp, idx) => {
        let color = idx === 0 ? 'green' : (idx === waypoints.length-1 ? 'red' : 'purple');
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        const marker = L.marker([wp.lat, wp.lon], {icon}).addTo(mapPlaces).bindPopup(`Stop ${idx+1}: ${wp.name}`);
        placeMarkers.push(marker);
    });
}

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

    // Dynamic Map Path Color Sync
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--btn-primary').trim() || '#2563eb';
    if(pathLayer) pathLayer.setStyle({color: themeColor});
    if(pathLayerPlaces) pathLayerPlaces.setStyle({color: themeColor});
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

async function onMapClick(e) {
    let lat = e.latlng.lat;
    let lon = e.latlng.lng;
    
    showLoading(true);
    let bestNode = await findNearestNode(lat, lon);
    showLoading(false);
    
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
    // Initialize map immediately with defaults to prevent white screen
    initMap(33.6844, 73.0479); 
    initMapPlaces(33.6844, 73.0479);

    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('graph-stats').innerHTML = 
            `Nodes: <strong>${data.nodes.toLocaleString()}</strong><br>
             Edges: <strong>${data.edges.toLocaleString()}</strong>`;
             
        if (data.preview_coords && data.preview_coords.length > 0) {
            coordNodes = data.preview_coords;
            for (let cn of coordNodes) nodeCoords[cn.id] = {lat: cn.lat, lon: cn.lon};
            // Map already initialized, just update view if needed
            map.setView([coordNodes[0].lat, coordNodes[0].lon], 13);
        }
    } catch (e) {
        document.getElementById('graph-stats').innerText = "Using default map view.";
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
                pathLayer = L.polyline(latlngs, {
                    color: getThemeColor(), 
                    weight: 6, 
                    opacity: 0.9,
                    lineJoin: 'round'
                }).addTo(map);
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

// Chart Logic function
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
