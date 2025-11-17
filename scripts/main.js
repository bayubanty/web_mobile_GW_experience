// ===============================
// Current Main Application Logic - COMPLETE WORKING VERSION
// ===============================

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];
let isLoading = false;
let map = null;
let mobileMap = null;
let mapMarkers = [];
let mobileMapMarkers = [];

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
        initializeMobileMap(hospitalData);
        renderHospitals(hospitalData);
        hideLoadingState();
    } catch (error) {
        console.error('Application initialization failed:', error);
        showErrorState('Failed to initialize application. Please refresh the page.');
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
        showErrorState('Failed to load hospital data. Please check your internet connection and try again.');
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
    
    // Download data button
    const downloadDataBtn = document.getElementById('downloadDataBtn');
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', downloadData);
    }
    
    // Initialize mobile event listeners
    initializeMobileEventListeners();
}

function initializeMobileEventListeners() {
    // Mobile view toggle buttons
    const mobileViewSystemsBtn = document.getElementById('mobileViewSystemsBtn');
    const mobileViewIndividualsBtn = document.getElementById('mobileViewIndividualsBtn');
    const mobileCompareHospitalsBtn = document.getElementById('mobileCompareHospitalsBtn');
    
    if (mobileViewSystemsBtn) {
        mobileViewSystemsBtn.addEventListener('click', () => {
            document.getElementById('viewSystemsBtn').click();
            syncMobileViewButtons();
        });
    }
    
    if (mobileViewIndividualsBtn) {
        mobileViewIndividualsBtn.addEventListener('click', () => {
            document.getElementById('viewIndividualsBtn').click();
            syncMobileViewButtons();
        });
    }
    
    if (mobileCompareHospitalsBtn) {
        mobileCompareHospitalsBtn.addEventListener('click', () => {
            window.location.href = 'compare.html';
        });
    }
    
    // Mobile hospital type filters
    const mobileFilterCriticalBtn = document.getElementById('mobileFilterCriticalBtn');
    const mobileFilterAcuteBtn = document.getElementById('mobileFilterAcuteBtn');
    
    if (mobileFilterCriticalBtn) {
        mobileFilterCriticalBtn.addEventListener('click', () => {
            document.getElementById('filterCriticalBtn').click();
            syncMobileFilterButtons();
        });
    }
    
    if (mobileFilterAcuteBtn) {
        mobileFilterAcuteBtn.addEventListener('click', () => {
            document.getElementById('filterAcuteBtn').click();
            syncMobileFilterButtons();
        });
    }
    
    // Mobile apply filters
    const mobileApplyFiltersBtn = document.getElementById('mobileApplyFiltersBtn');
    if (mobileApplyFiltersBtn) {
        mobileApplyFiltersBtn.addEventListener('click', () => {
            applyAllFilters();
            toggleMobileFilters();
        });
    }
    
    // Mobile reset filters
    const mobileResetFiltersBtn = document.getElementById('mobileResetFiltersBtn');
    if (mobileResetFiltersBtn) {
        mobileResetFiltersBtn.addEventListener('click', () => {
            resetAllFilters();
            setTimeout(() => toggleMobileFilters(), 100);
        });
    }
    
    // Mobile apply location
    const mobileApplyLocationBtn = document.getElementById('mobileApplyLocationBtn');
    if (mobileApplyLocationBtn) {
        mobileApplyLocationBtn.addEventListener('click', () => {
            applyAllFilters();
            toggleMobileFilters();
        });
    }
}

function syncMobileViewButtons() {
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const mobileViewSystemsBtn = document.getElementById('mobileViewSystemsBtn');
    const mobileViewIndividualsBtn = document.getElementById('mobileViewIndividualsBtn');
    const mobileIndividualOptions = document.getElementById('mobileIndividualOptions');

    if (viewSystemsBtn && mobileViewSystemsBtn) {
        // Remove active class from all mobile view buttons
        mobileViewSystemsBtn.classList.remove('active');
        mobileViewIndividualsBtn.classList.remove('active');
        
        // Add active class to corresponding mobile button
        if (viewSystemsBtn.classList.contains('active')) {
            mobileViewSystemsBtn.classList.add('active');
            if (mobileIndividualOptions) mobileIndividualOptions.style.display = 'none';
        } else if (viewIndividualsBtn.classList.contains('active')) {
            mobileViewIndividualsBtn.classList.add('active');
            if (mobileIndividualOptions) mobileIndividualOptions.style.display = 'block';
        }
    }
}

function syncMobileFilterButtons() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');
    const mobileFilterCriticalBtn = document.getElementById('mobileFilterCriticalBtn');
    const mobileFilterAcuteBtn = document.getElementById('mobileFilterAcuteBtn');

    if (filterCriticalBtn && mobileFilterCriticalBtn) {
        // Remove active class from all mobile filter buttons
        mobileFilterCriticalBtn.classList.remove('active');
        mobileFilterAcuteBtn.classList.remove('active');
        
        // Add active class to corresponding mobile button
        if (filterCriticalBtn.classList.contains('active')) {
            mobileFilterCriticalBtn.classList.add('active');
        } else if (filterAcuteBtn.classList.contains('active')) {
            mobileFilterAcuteBtn.classList.add('active');
        }
    }
}

function deactivateAllViewButtons() {
    const buttons = ['viewSystemsBtn', 'viewIndividualsBtn'];
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
    const checkedBoxes = document.querySelectorAll('.sidebar input[type="checkbox"]:checked');
    if (checkedBoxes.length > 0) {
        filtered = filtered.filter(hospital => {
            return Array.from(checkedBoxes).every(checkbox => {
                const value = checkbox.value;
                switch(value) {
                    case 'Urban': return hospital.Urban_Rural === 'Urban';
                    case 'Rural': return hospital.Urban_Rural === 'Rural';
                    case 'Non-profit': return hospital.Ownership_Type === 'Nonprofit';
                    case 'For Profit': return hospital.Ownership_Type === 'For Profit';
                    case 'Church Affiliated': return hospital.Ownership_Type && hospital.Ownership_Type.includes('Church');
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
                const hospitalLat = parseFloat(hospital.Latitude);
                const hospitalLon = parseFloat(hospital.Longitude);
                
                if (!hospitalLat || !hospitalLon) return false;
                
                const distance = calculateDistance(
                    coords[0], coords[1],
                    hospitalLat, hospitalLon
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
    updateMobileMapMarkers(filteredHospitalData);
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
            // Already handled by location filter
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
        resultsTable.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3>No Hospitals Found</h3>
                    <p>Try adjusting your filters to see more results.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    data.forEach(hospital => {
        // Main row
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
            <span style="color: #666;">${hospital.City}, ${hospital.State}</span>
        `;
        row.appendChild(nameCell);
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('details-buttons');
        
        const toggleDetailBtn = document.createElement('button');
        toggleDetailBtn.textContent = 'View Details ▼';
        toggleDetailBtn.classList.add('toggle-detail');
        
        const viewFullDetailBtn = document.createElement('button');
        viewFullDetailBtn.textContent = 'View Full Details';
        viewFullDetailBtn.classList.add('view-full-detail');
        viewFullDetailBtn.addEventListener('click', () => {
            window.location.href = `details.html?id=${hospital.Hospital_ID}`;
        });
        
        actionsCell.appendChild(toggleDetailBtn);
        actionsCell.appendChild(viewFullDetailBtn);
        row.appendChild(actionsCell);
        
        // Detail row (initially hidden)
        const detailRow = document.createElement('tr');
        detailRow.classList.add('hospital-detail-row');
        detailRow.style.display = 'none';
        
        const detailCell = document.createElement('td');
        detailCell.colSpan = 3;
        detailCell.innerHTML = `
            <div class="detail-info">
                <p class="inline-stars">
                    <strong>Financial Transparency:</strong> 
                    ${renderStars(convertGradeToStars(convertRatingToGrade(hospital.FTIH_Category_Rating)).value)}
                </p>
                <p class="inline-stars">
                    <strong>Community Benefit:</strong> 
                    ${renderStars(convertGradeToStars(convertRatingToGrade(hospital.CBS_Category_Rating)).value)}
                </p>
                <p class="inline-stars">
                    <strong>Affordability & Billing:</strong> 
                    ${renderStars(convertGradeToStars(convertRatingToGrade(hospital.HAB_Category_Rating)).value)}
                </p>
                <p class="inline-stars">
                    <strong>Access & Responsibility:</strong> 
                    ${renderStars(convertGradeToStars(convertRatingToGrade(hospital.HASR_Category_Rating)).value)}
                </p>
            </div>
        `;
        
        detailRow.appendChild(detailCell);
        
        // Toggle functionality
        toggleDetailBtn.addEventListener('click', () => {
            const isHidden = detailRow.style.display === 'none' || detailRow.style.display === '';
            detailRow.style.display = isHidden ? 'table-row' : 'none';
            toggleDetailBtn.textContent = isHidden ? 'Hide Details ▲' : 'View Details ▼';
        });
        
        resultsTable.appendChild(row);
        resultsTable.appendChild(detailRow);
    });
}

// Map Functions
function initializeHospitalMap(data) {
    const mapDiv = document.getElementById('mainMap');
    if (!mapDiv) return;

    map = L.map('mainMap').setView([32.7, -83.4], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    updateMapMarkers(data);
}

function initializeMobileMap(data) {
    const mobileMapDiv = document.getElementById('mobileMainMap');
    if (!mobileMapDiv) return;

    mobileMap = L.map('mobileMainMap').setView([32.7, -83.4], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(mobileMap);

    updateMobileMapMarkers(data);
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
        const lat = parseFloat(hospital.Latitude);
        const lon = parseFloat(hospital.Longitude);

        if (!lat || !lon) return;

        const grade = convertRatingToGrade(hospital.Overall_Star_Rating);
        const stars = convertGradeToStars(grade);

        const popupHTML = `
        <div class="map-popup" style="min-width: 200px;">
            <strong>${hospital.Hospital_Name}</strong><br>
            ${hospital.City}, ${hospital.State}<br>
            <div class="star-rating">${renderStars(stars.value)}</div>
            <a href="details.html?id=${hospital.Hospital_ID}" class="view-full-detail" 
               style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #f48810; color: white; text-decoration: none; border-radius: 4px;">
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

function updateMobileMapMarkers(data) {
    if (!mobileMap) return;
    
    // Clear old markers
    if (mobileMapMarkers.length > 0) {
        mobileMapMarkers.forEach(marker => mobileMap.removeLayer(marker));
        mobileMapMarkers = [];
    }

    if (data.length === 0) return;

    // Add new markers
    data.forEach(hospital => {
        const lat = parseFloat(hospital.Latitude);
        const lon = parseFloat(hospital.Longitude);

        if (!lat || !lon) return;

        const grade = convertRatingToGrade(hospital.Overall_Star_Rating);
        const stars = convertGradeToStars(grade);

        const popupHTML = `
        <div class="map-popup" style="min-width: 180px;">
            <strong>${hospital.Hospital_Name}</strong><br>
            ${hospital.City}, ${hospital.State}<br>
            <div class="star-rating">${renderStars(stars.value)}</div>
            <a href="details.html?id=${hospital.Hospital_ID}" class="view-full-detail"
               style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #f48810; color: white; text-decoration: none; border-radius: 4px;">
                View Details
            </a>
        </div>
        `;

        const marker = L.marker([lat, lon]).addTo(mobileMap).bindPopup(popupHTML);
        mobileMapMarkers.push(marker);
    });

    // Adjust map to fit all markers
    if (mobileMapMarkers.length > 0) {
        const group = new L.featureGroup(mobileMapMarkers);
        mobileMap.fitBounds(group.getBounds().pad(0.1));
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
        // Sync mobile filters when opening
        if (body.classList.contains('mobile-filter-open')) {
            syncMobileViewButtons();
            syncMobileFilterButtons();
            syncFilterInputs();
        }
    }, 10);
}

function syncFilterInputs() {
    // Sync checkbox states between mobile and desktop
    const desktopCheckboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
    const mobileCheckboxes = document.querySelectorAll('.mobile-filter-content input[type="checkbox"]');

    desktopCheckboxes.forEach((checkbox, index) => {
        if (mobileCheckboxes[index]) {
            mobileCheckboxes[index].checked = checkbox.checked;
        }
    });

    // Sync input values
    const zipInput = document.getElementById('zipInput');
    const mobileZipInput = document.getElementById('mobileZipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    const mobileRadiusSelect = document.getElementById('mobileRadiusSelect');

    if (zipInput && mobileZipInput) {
        mobileZipInput.value = zipInput.value;
    }
    if (radiusSelect && mobileRadiusSelect) {
        mobileRadiusSelect.value = radiusSelect.value;
    }
}

// Utility functions
function showLoadingState() {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsCount) resultsCount.textContent = 'Loading hospitals...';
    if (resultsTable) {
        resultsTable.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <p>Loading hospital data...</p>
                </td>
            </tr>
        `;
    }
}

function hideLoadingState() {
    // Loading state will be replaced by render function
}

function showErrorState(message) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsCount) resultsCount.textContent = 'Error loading data';
    if (resultsTable) {
        resultsTable.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3>Unable to Load Data</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        background: #6fb353;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 16px;
                    ">Try Again</button>
                </td>
            </tr>
        `;
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
    updateMobileMapMarkers(hospitalData);
}

function downloadData() {
    // Simple CSV export functionality
    const headers = ['Hospital_Name', 'City', 'State', 'Overall_Star_Rating', 'Urban_Rural', 'Ownership_Type'];
    const csvContent = [
        headers.join(','),
        ...filteredHospitalData.map(hospital => 
            headers.map(header => `"${hospital[header] || ''}"`).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'georgia_hospitals.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

// Add loading spinner styles
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #6fb353;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadingStyles);
