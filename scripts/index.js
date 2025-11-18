// ===============================
// Index Page Specific Functionality
// ===============================

// Map variables
let map = null;
let mapMarkers = [];
let mobileMap = null;
let mobileMapMarkers = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing application...");
    initApplication();
});

async function initApplication() {
    try {
        console.log("Starting application initialization...");
        
        // Load hospital data first
        await loadHospitalData();
        
        console.log("Hospital data loaded, initializing components...");
        console.log("Available hospital data:", window.hospitalData);

        // Initialize all components
        initHospitalMap(window.hospitalData);
        initMobileMap(window.hospitalData);
        initMobileNavigation();
        initMobileEventListeners();
        initViewToggleButtons();
        initFilterButtons();

        // Initial render
        console.log("Rendering hospitals...");
        renderHospitals(window.hospitalData);
        
        console.log("Application initialization complete!");
        
    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorPopup('Failed to initialize application. Please check the console for details.');
    }
}

// ===============================
// Map Functions
// ===============================

function initHospitalMap(data) {
    console.log("Initializing main map with data:", data);
    const mapDiv = document.getElementById('mainMap');
    
    if (!mapDiv) {
        console.error('Map container not found!');
        return;
    }

    if (!map) {
        map = L.map('mainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
    }

    updateMapMarkers(data);
}

function updateMapMarkers(data) {
    console.log("Updating map markers with data:", data);
    
    // Clear old markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    if (!data || data.length === 0) {
        console.log('No data to display on map');
        return;
    }

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        // If no coordinates, approximate from ZIP code
        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }

        if (!lat || !lon) {
            console.warn('No coordinates for hospital:', hospital.Name);
            return;
        }

        const grade = hospital.TIER_1_GRADE_Lown_Composite || 'N/A';
        const stars = convertGradeToStars(grade);
        const popupHTML = `
        <div class="map-popup">
            <strong>${hospital.Name || 'Unnamed Hospital'}</strong><br>
            ${hospital.City || ''}, ${hospital.State || ''}<br>
            <div class="star-rating">${renderStars(stars.value)}</div>
            <a href="details.html?id=${hospital.RECORD_ID}" class="view-full-detail">
                View Full Details
            </a>
        </div>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    // Adjust map to fit all visible markers
    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
    }

    // Ensure map is properly sized
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 100);
}

// ... (rest of your existing index.js code remains the same, just add the debug version above)

// ===============================
// Index Page Specific Functionality
// ===============================

// Map variables
let map = null;
let mapMarkers = [];
let mobileMap = null;
let mobileMapMarkers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApplication();
});

async function initApplication() {
    try {
        // Load hospital data first
        await loadHospitalData();
        
        // Initialize all components
        initHospitalMap(window.hospitalData);
        initMobileMap(window.hospitalData);
        initMobileNavigation();
        initMobileEventListeners();
        initViewToggleButtons();
        initFilterButtons();
        
        // Initial render
        renderHospitals(window.hospitalData);
        
    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorPopup('Failed to load hospital data. Please refresh the page.');
    }
}

// ===============================
// Map Functions
// ===============================
function initHospitalMap(data) {
    const mapDiv = document.getElementById('mainMap');
    if (!mapDiv) {
        console.error('Map container not found!');
        return;
    }

    if (!map) {
        map = L.map('mainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
    }

    updateMapMarkers(data);
}

function updateMapMarkers(data) {
    // Clear old markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    if (!data || data.length === 0) {
        console.log('No data to display on map');
        return;
    }

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        // If no coordinates, approximate from ZIP code
        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }

        if (!lat || !lon) {
            console.warn('No coordinates for hospital:', hospital.Name);
            return;
        }

        const grade = hospital.TIER_1_GRADE_Lown_Composite || 'N/A';
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <div class="map-popup">
                <strong>${hospital.Name || 'Unnamed Hospital'}</strong><br>
                ${hospital.City || ''}, ${hospital.State || ''}<br>
                <div class="star-rating">${renderStars(stars.value)}</div>
                <a href="details.html?id=${hospital.RECORD_ID}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    // Adjust map to fit all visible markers
    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
    }

    // Ensure map is properly sized
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 100);
}

// ===============================
// Mobile Map Functions
// ===============================
function initMobileMap(data) {
    const mapDiv = document.getElementById('mobileMainMap');
    if (!mapDiv) return;

    if (!mobileMap) {
        mobileMap = L.map('mobileMainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(mobileMap);
    }

    updateMobileMapMarkers(data);
}

function updateMobileMapMarkers(data) {
    // Clear old markers
    mobileMapMarkers.forEach(marker => mobileMap.removeLayer(marker));
    mobileMapMarkers = [];

    if (!data || data.length === 0) return;

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        // If no coordinates, approximate from ZIP code
        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }

        if (!lat || !lon) return;

        const grade = hospital.TIER_1_GRADE_Lown_Composite || 'N/A';
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <div class="map-popup">
                <strong>${hospital.Name || 'Unnamed Hospital'}</strong><br>
                ${hospital.City || ''}, ${hospital.State || ''}<br>
                <div class="star-rating">${renderStars(stars.value)}</div>
                <a href="details.html?id=${hospital.RECORD_ID}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(mobileMap).bindPopup(popupHTML);
        mobileMapMarkers.push(marker);
    });

    // Adjust map to fit all visible markers
    if (mobileMapMarkers.length > 0) {
        const group = L.featureGroup(mobileMapMarkers);
        mobileMap.fitBounds(group.getBounds().pad(0.2));
    }

    // Ensure map is properly sized
    setTimeout(() => {
        if (mobileMap) {
            mobileMap.invalidateSize();
        }
    }, 100);
}

// ===============================
// Render Hospitals
// ===============================
function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');

    // Clear old results
    if (resultsTable) {
        resultsTable.innerHTML = '';
    }

    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `Viewing ${data ? data.length : 0} results`;
    }

    if (!data || !data.length) {
        if (resultsTable) {
            resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
        }
        return;
    }

    data.forEach(hospital => {
        // Convert letter grade to star rating
        const grade = hospital.TIER_1_GRADE_Lown_Composite || 'N/A';
        const stars = convertGradeToStars(grade);

        // === Main Row ===
        const row = document.createElement('tr');
        row.classList.add('hospital-row');

        const gradeCell = document.createElement('td');
        gradeCell.innerHTML = `
            <div class="star-rating" aria-label="${stars.value} out of 5 stars">
                ${renderStars(stars.value)}
            </div>
        `;
        row.appendChild(gradeCell);

        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <strong>
                <a href="details.html?id=${hospital.RECORD_ID}" class="hospital-link">
                    ${hospital.Name || 'Unnamed Hospital'}
                </a>
            </strong><br>
            ${hospital.City || ''}, ${hospital.State || ''}
        `;
        row.appendChild(nameCell);

        // === Buttons ===
        const buttonCell = document.createElement('td');
        buttonCell.classList.add('details-buttons');

        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'View Details ▼';
        detailsButton.classList.add('toggle-detail');

        const fullDetailsButton = document.createElement('button');
        fullDetailsButton.textContent = 'View Full Details';
        fullDetailsButton.classList.add('view-full-detail');
        fullDetailsButton.addEventListener('click', () => {
            window.location.href = `details.html?id=${hospital.RECORD_ID}`;
        });

        buttonCell.appendChild(detailsButton);
        buttonCell.appendChild(fullDetailsButton);
        row.appendChild(buttonCell);

        // === Detail Row (collapsed preview) ===
        const detailRow = document.createElement('tr');
        detailRow.classList.add('hospital-detail-row');
        detailRow.style.display = 'none';

        const detailCell = document.createElement('td');
        detailCell.colSpan = 3;
        detailCell.innerHTML = `
            <div class="detail-info">
                <p class="inline-stars"><strong>Outcome:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Outcome || 'F').value)}</p>
                <p class="inline-stars"><strong>Value:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Value || 'F').value)}</p>
                <p class="inline-stars"><strong>Civic:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Civic || 'F').value)}</p>
                <p class="inline-stars"><strong>Safety:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Saf || 'F').value)}</p>
                <p class="inline-stars"><strong>Experience:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Exp || 'F').value)}</p>
            </div>
        `;
        detailRow.appendChild(detailCell);

        // === Toggle Logic ===
        detailsButton.addEventListener('click', () => {
            const isHidden = detailRow.style.display === 'none' || detailRow.style.display === '';
            detailRow.style.display = isHidden ? 'table-row' : 'none';
            detailsButton.textContent = isHidden ? 'Hide Details ▲' : 'View Details ▼';
        });

        // === Append both rows ===
        if (resultsTable) {
            resultsTable.appendChild(row);
            resultsTable.appendChild(detailRow);
        }
    });

    // Update mobile map
    if (mobileMap) {
        updateMobileMapMarkers(data);
    }
}

// ===============================
// View Toggle and Filter Buttons
// ===============================
function initViewToggleButtons() {
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
    const individualOptions = document.getElementById('individualOptions');

    function deactivateAllViewButtons() {
        if (viewSystemsBtn) viewSystemsBtn.classList.remove('active');
        if (viewIndividualsBtn) viewIndividualsBtn.classList.remove('active');
        if (compareHospitalsBtn) compareHospitalsBtn.classList.remove('active');
    }

    // View Systems toggle
    if (viewSystemsBtn) {
        viewSystemsBtn.addEventListener('click', () => {
            deactivateAllViewButtons();
            viewSystemsBtn.classList.add('active');
            if (individualOptions) individualOptions.style.display = 'none';
            applyAllFilters();
        });
    }

    // View Individuals toggle
    if (viewIndividualsBtn) {
        viewIndividualsBtn.addEventListener('click', () => {
            deactivateAllViewButtons();
            viewIndividualsBtn.classList.add('active');
            if (individualOptions) individualOptions.style.display = 'block';
            applyAllFilters();
        });
    }

    // Compare Hospitals toggle
    if (compareHospitalsBtn) {
        compareHospitalsBtn.addEventListener('click', () => {
            window.location.href = 'compare.html';
        });
    }
}

function initFilterButtons() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    function deactivateHospitalTypeButtons() {
        if (filterCriticalBtn) filterCriticalBtn.classList.remove('active');
        if (filterAcuteBtn) filterAcuteBtn.classList.remove('active');
    }

    // Critical Access toggle
    if (filterCriticalBtn) {
        filterCriticalBtn.addEventListener('click', () => {
            const isActive = filterCriticalBtn.classList.contains('active');
            deactivateHospitalTypeButtons();
            if (!isActive) {
                filterCriticalBtn.classList.add('active');
            }
            applyAllFilters();
        });
    }

    // Acute Care toggle
    if (filterAcuteBtn) {
        filterAcuteBtn.addEventListener('click', () => {
            const isActive = filterAcuteBtn.classList.contains('active');
            deactivateHospitalTypeButtons();
            if (!isActive) {
                filterAcuteBtn.classList.add('active');
            }
            applyAllFilters();
        });
    }

    // Apply Location Button
    const applyLocationBtn = document.getElementById('applyLocationBtn');
    if (applyLocationBtn) {
        applyLocationBtn.addEventListener('click', () => {
            applyAllFilters();
        });
    }

    // Apply Filters Button
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyAllFilters();
        });
    }

    // Reset Filters Button
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetAllFilters);
    }

    // Sort Event Listener
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortAndRender(window.filteredHospitalData);
        });
    }

    // Download Data Button
    const downloadDataBtn = document.getElementById('downloadDataBtn');
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', () => {
            console.log('Download triggered');
            // TODO: backend or SheetJS export
        });
    }
}

// Helper function to get current selection
function getSelectedHospitalType() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    if (filterCriticalBtn && filterCriticalBtn.classList.contains('active')) return 'Critical Access';
    if (filterAcuteBtn && filterAcuteBtn.classList.contains('active')) return 'Acute Care';
    return null;
}

// ===============================
// Main Filter Function
// ===============================
function applyAllFilters() {
    if (!window.hospitalData) return;

    let filtered = [...window.hospitalData];

    // Apply hospital type filters
    const selectedHospitalType = getSelectedHospitalType();
    if (selectedHospitalType === 'Critical Access') {
        filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_CAH === 1);
    } else if (selectedHospitalType === 'Acute Care') {
        filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_ACH === 1);
    }

    // Apply checkbox filters
    const checked = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    if (checked.length > 0) {
        filtered = filtered.filter(hospital => {
            return checked.every(val => {
                switch(val) {
                    case 'Urban': return hospital.TYPE_urban === 1;
                    case 'Rural': return hospital.TYPE_rural === 1;
                    case 'Non-profit': return hospital.TYPE_NonProfit === 1;
                    case 'For Profit': return hospital.TYPE_ForProfit === 1;
                    case 'Church Affiliated': return hospital.TYPE_chrch_affl_f === 1;
                    case 'Academic Medical Center': return hospital.TYPE_AMC === 1;
                    case 'Safety Net': return hospital.TYPE_isSafetyNet === 1;
                    default: return JSON.stringify(hospital).toLowerCase().includes(val.toLowerCase());
                }
            });
        });
    }

    // Apply location filter
    const zipInput = document.getElementById('zipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    if (zipInput && radiusSelect) {
        const zip = zipInput.value.trim();
        const radius = radiusSelect.value;
        if (zip && /^\d{5}$/.test(zip)) {
            const coords = getZipCoords(zip);
            filtered = filtered.filter(hospital => {
                let lat = parseFloat(hospital.Latitude) || getZipCoords(hospital.Zip)[0];
                let lon = parseFloat(hospital.Longitude) || getZipCoords(hospital.Zip)[1];
                const distance = calculateDistance(coords[0], coords[1], lat, lon);
                return distance <= parseInt(radius);
            });
        }
    }

    window.filteredHospitalData = filtered;

    // Apply sorting and render
    sortAndRender(window.filteredHospitalData);
    updateMapMarkers(window.filteredHospitalData);
    updateMobileMapMarkers(window.filteredHospitalData);
}

// ===============================
// Sorting Function
// ===============================
function sortAndRender(data) {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect || !data) return;

    const sortValue = sortSelect.value;
    let sorted = [...data];

    if (sortValue === 'grade') {
        sorted.sort((a, b) => {
            const gradeOrder = {'A+': 12, 'A': 11, 'A-': 10, 'B+': 9, 'B': 8, 'B-': 7, 'C+': 6, 'C': 5, 'C-': 4, 'D+': 3, 'D': 2, 'D-': 1, 'F': 0, 'N/A': -1};
            const gradeA = a.TIER_1_GRADE_Lown_Composite || 'N/A';
            const gradeB = b.TIER_1_GRADE_Lown_Composite || 'N/A';
            return gradeOrder[gradeB] - gradeOrder[gradeA]; // High to low
        });
    } else if (sortValue === 'distance') {
        // Distance sorting handled in applyAllFilters
    } else if (sortValue === 'name') {
        sorted.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    } else if (sortValue === 'size') {
        const sizeOrder = {'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5};
        sorted.sort((a, b) => {
            const sizeA = sizeOrder[a.Size] || 0;
            const sizeB = sizeOrder[b.Size] || 0;
            return sizeA - sizeB; // Small to large
        });
    }

    renderHospitals(sorted);
}

// ===============================
// Reset Filters
// ===============================
function resetAllFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    const zipInput = document.getElementById('zipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    if (zipInput) zipInput.value = '';
    if (radiusSelect) radiusSelect.selectedIndex = 0;

    // Reset view buttons
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    if (viewSystemsBtn) viewSystemsBtn.classList.remove('active');
    if (viewIndividualsBtn) viewIndividualsBtn.classList.remove('active');
    if (filterCriticalBtn) filterCriticalBtn.classList.remove('active');
    if (filterAcuteBtn) filterAcuteBtn.classList.remove('active');

    // Reset to all data
    window.filteredHospitalData = [...window.hospitalData];
    renderHospitals(window.hospitalData);
    updateMapMarkers(window.hospitalData);
    updateMobileMapMarkers(window.hospitalData);
}

// ===============================
// Mobile Event Listeners
// ===============================
function initMobileEventListeners() {
    // Mobile filter toggle
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const mobileFilterClose = document.querySelector('.mobile-filter-close');
    const mobileFilterOverlay = document.querySelector('.mobile-filter-overlay');

    if (mobileFilterToggle && mobileFilterOverlay) {
        mobileFilterToggle.addEventListener('click', toggleMobileFilters);
        if (mobileFilterClose) {
            mobileFilterClose.addEventListener('click', toggleMobileFilters);
        }
        mobileFilterOverlay.addEventListener('click', function(e) {
            if (e.target === this) toggleMobileFilters();
        });
    }

    // Mobile filter buttons
    const mobileApplyFiltersBtn = document.getElementById('mobileApplyFiltersBtn');
    const mobileResetFiltersBtn = document.getElementById('mobileResetFiltersBtn');
    const mobileApplyLocationBtn = document.getElementById('mobileApplyLocationBtn');

    if (mobileApplyFiltersBtn) {
        mobileApplyFiltersBtn.addEventListener('click', function() {
            applyAllFilters();
            toggleMobileFilters();
        });
    }

    if (mobileResetFiltersBtn) {
        mobileResetFiltersBtn.addEventListener('click', function() {
            resetAllFilters();
            setTimeout(() => {
                toggleMobileFilters();
            }, 100);
        });
    }

    if (mobileApplyLocationBtn) {
        mobileApplyLocationBtn.addEventListener('click', function() {
            applyAllFilters();
            toggleMobileFilters();
        });
    }
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
