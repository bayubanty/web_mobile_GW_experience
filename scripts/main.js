// ===============================
// Current Main Application Logic - CORRECTED VERSION
// ===============================

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];
let isLoading = false;
let map = null;
let mapMarkers = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main application loaded');
    initializeApplication();
});

async function initializeApplication() {
    try {
        showLoadingState();
        await loadHospitalData();
        initializeEventListeners();
        initializeMobileNavigation();
        initializeHospitalMap(hospitalData);
        renderHospitals(hospitalData);
        hideLoadingState();
    } catch (error) {
        console.error('Application initialization failed:', error);
        showErrorState('Failed to initialize application');
    }
}

// Data loading
async function loadHospitalData() {
    if (isLoading) return;
    
    isLoading = true;
    try {
        const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hospitalData = data.hospitals;
        filteredHospitalData = [...hospitalData];
        
        console.log('Hospital data loaded:', hospitalData.length, 'records');
        
    } catch (err) {
        console.error("Error loading JSON:", err);
        throw err;
    } finally {
        isLoading = false;
    }
}

// Event listeners
function initializeEventListeners() {
    // View toggle buttons
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
    
    if (viewSystemsBtn) {
        viewSystemsBtn.addEventListener('click', () => {
            deactivateAllViewButtons();
            viewSystemsBtn.classList.add('active');
            document.getElementById('individualOptions').style.display = 'none';
            applyAllFilters();
        });
    }
    
    if (viewIndividualsBtn) {
        viewIndividualsBtn.addEventListener('click', () => {
            deactivateAllViewButtons();
            viewIndividualsBtn.classList.add('active');
            document.getElementById('individualOptions').style.display = 'block';
            applyAllFilters();
        });
    }
    
    if (compareHospitalsBtn) {
        compareHospitalsBtn.addEventListener('click', () => {
            window.location.href = 'compare.html';
        });
    }
    
    // Hospital type filters
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');
    
    if (filterCriticalBtn) {
        filterCriticalBtn.addEventListener('click', () => {
            const isActive = filterCriticalBtn.classList.contains('active');
            deactivateHospitalTypeButtons();
            if (!isActive) filterCriticalBtn.classList.add('active');
            applyAllFilters();
        });
    }
    
    if (filterAcuteBtn) {
        filterAcuteBtn.addEventListener('click', () => {
            const isActive = filterAcuteBtn.classList.contains('active');
            deactivateHospitalTypeButtons();
            if (!isActive) filterAcuteBtn.classList.add('active');
            applyAllFilters();
        });
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyAllFilters);
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
    
    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortAndRender(filteredHospitalData, e.target.value);
        });
    }
    
    // Location search
    const applyLocationBtn = document.getElementById('applyLocationBtn');
    if (applyLocationBtn) {
        applyLocationBtn.addEventListener('click', applyAllFilters);
    }
    
    // Mobile filter buttons
    const mobileApplyFiltersBtn = document.getElementById('mobileApplyFiltersBtn');
    if (mobileApplyFiltersBtn) {
        mobileApplyFiltersBtn.addEventListener('click', () => {
            applyAllFilters();
            toggleMobileFilters();
        });
    }
}

function deactivateAllViewButtons() {
    const buttons = ['viewSystemsBtn', 'viewIndividualsBtn', 'compareHospitalsBtn'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('active');
    });
}

function deactivateHospitalTypeButtons() {
    const buttons = ['filterCriticalBtn', 'filterAcuteBtn'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('active');
    });
}

function applyAllFilters() {
    if (hospitalData.length === 0) return;
    
    let filtered = [...hospitalData];
    
    // View type filters
    if (document.getElementById('viewSystemsBtn')?.classList.contains('active')) {
        filtered = filtered.filter(hospital => hospital.In_System === 1);
    } else if (document.getElementById('viewIndividualsBtn')?.classList.contains('active')) {
        if (document.getElementById('filterCriticalBtn')?.classList.contains('active')) {
            filtered = filtered.filter(hospital => hospital.Care_Level === 'Primary');
        } else if (document.getElementById('filterAcuteBtn')?.classList.contains('active')) {
            filtered = filtered.filter(hospital => hospital.Care_Level === 'Acute Care' || hospital.Care_Level === 'Regional Referral');
        }
    }
    
    // Checkbox filters
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length > 0) {
        filtered = filtered.filter(hospital => {
            return Array.from(checkedBoxes).every(checkbox => {
                const value = checkbox.value;
                switch(value) {
                    case 'Urban': return hospital.Urban_Rural === 'Urban';
                    case 'Rural': return hospital.Urban_Rural === 'Rural';
                    case 'Non-profit': return hospital.Ownership_Type === 'Nonprofit';
                    case 'For Profit': return hospital.Ownership_Type === 'For Profit';
                    case 'Church Affiliated': return hospital.Ownership_Type === 'Church Affiliated';
                    case 'Academic Medical Center': return hospital.Care_Level === 'Regional Referral';
                    case 'Safety Net': return hospital.Ownership_Type === 'Government';
                    default: return true;
                }
            });
        });
    }
    
    // Location filter
    const zipInput = document.getElementById('zipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    if (zipInput && radiusSelect && zipInput.value.trim()) {
        const zip = zipInput.value.trim();
        const radius = parseInt(radiusSelect.value);
        
        if (/^\d{5}$/.test(zip)) {
            const coords = getZipCoords(zip);
            filtered = filtered.filter(hospital => {
                const distance = calculateDistance(
                    coords[0], coords[1],
                    parseFloat(hospital.Latitude),
                    parseFloat(hospital.Longitude)
                );
                return distance <= radius;
            });
        }
    }
    
    filteredHospitalData = filtered;
    
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect ? sortSelect.value : 'grade';
    sortAndRender(filteredHospitalData, sortValue);
    updateMapMarkers(filteredHospitalData);
}

function sortAndRender(data, sortValue = 'grade') {
    let sorted = [...data];
    
    switch(sortValue) {
        case 'grade':
            sorted.sort((a, b) => (b.Overall_Star_Rating || 0) - (a.Overall_Star_Rating || 0));
            break;
        case 'name':
            sorted.sort((a, b) => (a.Hospital_Name || '').localeCompare(b.Hospital_Name || ''));
            break;
        case 'size':
            const sizeOrder = {'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6};
            sorted.sort((a, b) => (sizeOrder[a.Size_Group] || 0) - (sizeOrder[b.Size_Group] || 0));
            break;
        case 'distance':
            // Already sorted by distance in applyAllFilters
            break;
    }
    
    renderHospitals(sorted);
}

function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!resultsTable) return;
    
    resultsTable.innerHTML = '';
    resultsCount.textContent = `Viewing ${data.length} results`;
    
    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
        return;
    }
    
    data.forEach(hospital => {
        const row = document.createElement('tr');
        row.classList.add('hospital-row');
        
        // Grade cell
        const gradeCell = document.createElement('td');
        const grade = convertRatingToGrade(hospital.Overall_Star_Rating);
        const stars = convertGradeToStars(grade);
        gradeCell.innerHTML = `<div class="star-rating">${renderStars(stars.value)}</div>`;
        row.appendChild(gradeCell);
        
        // Name cell
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <strong>${hospital.Hospital_Name}</strong><br>
            ${hospital.City}, ${hospital.State}
        `;
        row.appendChild(nameCell);
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('details-buttons');
        actionsCell.innerHTML = `
            <button class="view-full-detail" onclick="window.location.href='details.html?id=${hospital.Hospital_ID}'">
                View Details
            </button>
        `;
        row.appendChild(actionsCell);
        
        resultsTable.appendChild(row);
    });
}

// Map Functions
function initializeHospitalMap(data) {
    const mapDiv = document.getElementById('mainMap');
    if (!mapDiv) {
        console.error('Map container not found!');
        return;
    }

    // Initialize map
    map = L.map('mainMap').setView([32.7, -83.4], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    updateMapMarkers(data);
}

function updateMapMarkers(data) {
    // Clear old markers
    if (mapMarkers.length > 0) {
        mapMarkers.forEach(marker => map.removeLayer(marker));
        mapMarkers = [];
    }

    if (data.length === 0) return;

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        if (!lat || !lon) {
            // Use ZIP code approximation if coordinates are missing
            const coords = getZipCoords(hospital.ZIP_Code.toString());
            lat = coords[0];
            lon = coords[1];
        }

        const grade = convertRatingToGrade(hospital.Overall_Star_Rating);
        const stars = convertGradeToStars(grade);

        const popupHTML = `
        <div class="map-popup">
            <strong>${hospital.Hospital_Name}</strong><br>
            ${hospital.City}, ${hospital.State}<br>
            <div class="star-rating">${renderStars(stars.value)}</div>
            <a href="details.html?id=${hospital.Hospital_ID}" class="view-full-detail">
                View Full Details
            </a>
        </div>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    // Adjust map to fit all markers
    if (mapMarkers.length > 0) {
        const group = new L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Mobile navigation
function initializeMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileFilterClose = document.querySelector('.mobile-filter-close');
    
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileNavigation);
    }
    
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', toggleMobileNavigation);
    }
    
    if (mobileFilterToggle) {
        mobileFilterToggle.addEventListener('click', toggleMobileFilters);
    }
    
    if (mobileFilterClose) {
        mobileFilterClose.addEventListener('click', toggleMobileFilters);
    }
    
    // Close panels when clicking overlay
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileFilterOverlay = document.querySelector('.mobile-filter-overlay');
    
    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', function(e) {
            if (e.target === this) toggleMobileNavigation();
        });
    }
    
    if (mobileFilterOverlay) {
        mobileFilterOverlay.addEventListener('click', function(e) {
            if (e.target === this) toggleMobileFilters();
        });
    }
}

function toggleMobileNavigation() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const panel = document.querySelector('.mobile-nav-panel');
    
    if (!overlay || !panel) return;
    
    body.classList.toggle('mobile-nav-open');
    overlay.style.display = body.classList.contains('mobile-nav-open') ? 'block' : 'none';
    setTimeout(() => {
        panel.classList.toggle('active');
    }, 10);
}

function toggleMobileFilters() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-filter-overlay');
    const panel = document.querySelector('.mobile-filter-panel');
    
    if (!overlay || !panel) return;
    
    body.classList.toggle('mobile-filter-open');
    overlay.style.display = body.classList.contains('mobile-filter-open') ? 'block' : 'none';
    setTimeout(() => {
        panel.classList.toggle('active');
    }, 10);
}

// Utility functions
function showLoadingState() {
    const resultsTable = document.getElementById('hospitalResults');
    if (resultsTable) {
        resultsTable.innerHTML = '<tr><td colspan="3">Loading hospitals...</td></tr>';
    }
}

function hideLoadingState() {
    // Handled by render function
}

function showErrorState(message) {
    const resultsTable = document.getElementById('hospitalResults');
    if (resultsTable) {
        resultsTable.innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
    }
}

function resetAllFilters() {
    // Reset view buttons
    deactivateAllViewButtons();
    deactivateHospitalTypeButtons();
    
    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Reset inputs
    const zipInput = document.getElementById('zipInput');
    if (zipInput) zipInput.value = '';
    
    const radiusSelect = document.getElementById('radiusSelect');
    if (radiusSelect) radiusSelect.selectedIndex = 0;
    
    // Reset sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.selectedIndex = 0;
    
    // Reset to all data
    filteredHospitalData = [...hospitalData];
    sortAndRender(filteredHospitalData);
    updateMapMarkers(hospitalData);
}

function convertRatingToGrade(rating) {
    if (!rating || rating === 'N/A') return 'N/A';
    const gradeMap = {5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F'};
    return gradeMap[rating] || 'N/A';
}

function convertGradeToStars(grade) {
    const gradeMap = {
        'A+': 5, 'A': 5, 'A-': 4.5, 'B+': 4.5, 'B': 4, 'B-': 3.5,
        'C+': 3.5, 'C': 3, 'C-': 2.5, 'D+': 2.5, 'D': 2, 'D-': 1.5,
        'F': 1, 'N/A': 0
    };
    return { value: gradeMap[grade] || 0 };
}

function renderStars(value) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (value >= i) {
            html += '<svg class="star full" viewBox="0 0 24 24" width="20" height="20"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>';
        } else if (value >= i - 0.5) {
            html += '<svg class="star half" viewBox="0 0 24 24" width="20" height="20"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z" fill="url(#halfGradient)"/></svg>';
        } else {
            html += '<svg class="star empty" viewBox="0 0 24 24" width="20" height="20"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z" fill="#ddd"/></svg>';
        }
    }
    return html;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getZipCoords(zip) {
    const lookup = {
        '31513': [33.54609, -82.3163154], // Baxley
        '31510': [31.538626, -82.459238], // Alma
        '30309': [33.80915, -84.39547], // Atlanta - Piedmont
        '30322': [33.7954, -84.3202], // Atlanta - Emory
        '30830': [33.0833, -82.0134], // Waynesboro
        '31701': [31.59022, -84.15779], // Albany
        '30342': [33.908404, -84.354543], // Atlanta
        '30180': [33.56995, -85.07421], // Villa Rica
        '30606': [34.16608, -83.4013], // Athens
        '30060': [33.96795, -84.55135] // Marietta
    };
    return lookup[zip] || [32.5, -83.5]; // Default to central Georgia
}
