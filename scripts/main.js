// ===============================
// Current Main Application Logic
// This is the version that index.html uses
// ===============================

// Use the patched version as the main implementation
// Import all functionality from main_patched.js

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];
let isLoading = false;

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
    // Filter buttons
    const filterButtons = ['viewSystemsBtn', 'viewIndividualsBtn', 'filterCriticalBtn', 'filterAcuteBtn'];
    filterButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => handleFilterToggle(btnId));
        }
    });
    
    // Apply filters
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyAllFilters);
    }
    
    // Reset filters
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
    
    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortAndRender(filteredHospitalData, e.target.value);
        });
    }
    
    // Location
    const applyLocationBtn = document.getElementById('applyLocationBtn');
    if (applyLocationBtn) {
        applyLocationBtn.addEventListener('click', applyAllFilters);
    }
}

function handleFilterToggle(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    button.classList.toggle('active');
    
    // Handle mutually exclusive buttons
    const exclusiveGroups = {
        'viewSystemsBtn': ['viewIndividualsBtn'],
        'viewIndividualsBtn': ['viewSystemsBtn'],
        'filterCriticalBtn': ['filterAcuteBtn'],
        'filterAcuteBtn': ['filterCriticalBtn']
    };
    
    if (exclusiveGroups[buttonId]) {
        exclusiveGroups[buttonId].forEach(otherBtnId => {
            const otherBtn = document.getElementById(otherBtnId);
            if (otherBtn) otherBtn.classList.remove('active');
        });
    }
    
    applyAllFilters();
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
            filtered = filtered.filter(hospital => hospital.Care_Level === 'Acute Care');
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
                    hospital.Latitude, hospital.Longitude
                );
                return distance <= radius;
            });
        }
    }
    
    filteredHospitalData = filtered;
    
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect ? sortSelect.value : 'grade';
    sortAndRender(filteredHospitalData, sortValue);
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

// Mobile navigation
function initializeMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileNavigation);
    }
    
    if (mobileFilterToggle) {
        mobileFilterToggle.addEventListener('click', toggleMobileFilters);
    }
}

function toggleMobileNavigation() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const panel = document.querySelector('.mobile-nav-panel');
    
    body.classList.toggle('mobile-nav-open');
    if (overlay) overlay.style.display = body.classList.contains('mobile-nav-open') ? 'block' : 'none';
    if (panel) panel.classList.toggle('active');
}

function toggleMobileFilters() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-filter-overlay');
    const panel = document.querySelector('.mobile-filter-panel');
    
    body.classList.toggle('mobile-filter-open');
    if (overlay) overlay.style.display = body.classList.contains('mobile-filter-open') ? 'block' : 'none';
    if (panel) panel.classList.toggle('active');
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
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
    
    filteredHospitalData = [...hospitalData];
    sortAndRender(filteredHospitalData);
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
        if (value >= i) html += '★';
        else if (value >= i - 0.5) html += '½';
        else html += '☆';
    }
    return html;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
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
        '31513': [33.54609, -82.3163154], '31510': [31.538626, -82.459238],
        '30309': [33.80915, -84.39547], '30322': [33.7954, -84.3202]
    };
    return lookup[zip] || [32.5, -83.5];
}
