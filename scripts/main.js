// ===============================
// Main Application Logic
// ===============================

// Map variables
let map = null;
let mapMarkers = [];
let mobileMap = null;
let mobileMapMarkers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            
            if (document.body.classList.contains('mobile-nav-open')) {
                toggleMobileNavigation();
            }
        });
    });

    // Initialize the default page
    showPage('index');

    // Load hospital data and initialize the app
    loadHospitalData();
    initMobileNavigation();
    initMobileEventListeners();
    initViewToggleButtons();
    initFilterButtons();
});

// Load JSON Data
async function loadHospitalData() {
    try {
        const response = await fetch('data/2025/2025_GW_HospitalScores.json');
        const rawData = await response.json();
        
        // Transform the data to match expected format
        hospitalData = rawData.map(hospital => ({
            RECORD_ID: hospital.Hospital_ID,
            Name: hospital.Hospital_Name,
            Address: hospital.Street_Address,
            City: hospital.City,
            State: hospital.State,
            Zip: hospital.ZIP_Code,
            County: hospital.County,
            Latitude: hospital.Latitude,
            Longitude: hospital.Longitude,
            TYPE_urban: hospital.Urban_Rural === 'Urban' ? 1 : 0,
            TYPE_rural: hospital.Urban_Rural === 'Rural' ? 1 : 0,
            TYPE_NonProfit: hospital.Ownership_Type === 'Nonprofit' ? 1 : 0,
            TYPE_ForProfit: hospital.Ownership_Type === 'For Profit' ? 1 : 0,
            TYPE_HospTyp_CAH: hospital.Care_Level === 'Primary' ? 1 : 0,
            TYPE_HospTyp_ACH: hospital.Care_Level === 'Acute Care' ? 1 : 0,
            Size: hospital.Size_Group ? hospital.Size_Group.toLowerCase() : 'm',
            HOSPITAL_SYSTEM: hospital.In_System === 1,
            TIER_1_GRADE_Lown_Composite: convertRatingToGrade(hospital.Overall_Star_Rating),
            TIER_2_GRADE_Outcome: convertRatingToGrade(hospital.FTIH_Category_Rating),
            TIER_2_GRADE_Value: convertRatingToGrade(hospital.CBS_Category_Rating),
            TIER_2_GRADE_Civic: convertRatingToGrade(hospital.HAB_Category_Rating),
            TIER_3_GRADE_Pat_Saf: convertRatingToGrade(hospital.HASR_Category_Rating),
            TIER_3_GRADE_Pat_Exp: convertRatingToGrade(hospital.Overall_Star_Rating),
            _original: hospital
        }));

        filteredHospitalData = [...hospitalData];
        
        // Initial render
        renderHospitals(hospitalData);
        initHospitalMap(hospitalData);
        initMobileMap(hospitalData);
        
    } catch (err) {
        console.error("Error loading JSON:", err);
    }
}

// Render Hospitals
function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');

    // Clear old results
    resultsTable.innerHTML = '';

    // Update results count
    resultsCount.textContent = `Viewing ${data.length} results`;

    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
        return;
    }

    data.forEach(hospital => {
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
        resultsTable.appendChild(row);
        resultsTable.appendChild(detailRow);
    });

    // Update mobile map
    if (mobileMap) {
        updateMobileMapMarkers(data);
    }
}

// Map Functions
function initHospitalMap(data) {
    const mapDiv = document.getElementById('mainMap');
    if (!mapDiv) return;

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

    if (data.length === 0) return;

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

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

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    // Adjust map to fit all visible markers
    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
}

// Mobile Map Functions
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
    mobileMapMarkers.forEach(marker => mobileMap.removeLayer(marker));
    mobileMapMarkers = [];

    if (data.length === 0) return;

    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

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

    if (mobileMapMarkers.length > 0) {
        const group = L.featureGroup(mobileMapMarkers);
        mobileMap.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => {
        if (mobileMap) mobileMap.invalidateSize();
    }, 100);
}

// Mobile Navigation & Filter Functions
function initMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');

    if (mobileNavToggle && mobileNavOverlay) {
        mobileNavToggle.addEventListener('click', toggleMobileNavigation);
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', toggleMobileNavigation);
        }
        mobileNavOverlay.addEventListener('click', function(e) {
            if (e.target === this) toggleMobileNavigation();
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

function initMobileEventListeners() {
    // Mobile navigation toggle
    document.querySelector('.mobile-nav-toggle')?.addEventListener('click', toggleMobileNavigation);
    document.querySelector('.mobile-nav-close')?.addEventListener('click', toggleMobileNavigation);
    document.querySelector('.mobile-nav-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) toggleMobileNavigation();
    });

    // Mobile filter toggle
    document.querySelector('.mobile-filter-toggle')?.addEventListener('click', toggleMobileFilters);
    document.querySelector('.mobile-filter-close')?.addEventListener('click', toggleMobileFilters);
    document.querySelector('.mobile-filter-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) toggleMobileFilters();
    });

    // Mobile filter buttons
    document.getElementById('mobileApplyFiltersBtn')?.addEventListener('click', function() {
        applyAllFilters();
        toggleMobileFilters();
    });

    document.getElementById('mobileResetFiltersBtn')?.addEventListener('click', function() {
        resetAllFilters();
        setTimeout(() => {
            toggleMobileFilters();
        }, 100);
    });

    document.getElementById('mobileApplyLocationBtn')?.addEventListener('click', function() {
        applyAllFilters();
        toggleMobileFilters();
    });
}

function toggleMobileFilters() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-filter-overlay');
    const panel = document.querySelector('.mobile-filter-panel');

    body.classList.toggle('mobile-filter-open');
    overlay.style.display = body.classList.contains('mobile-filter-open') ? 'block' : 'none';
    setTimeout(() => {
        panel.classList.toggle('active');
    }, 10);
}

// View Toggle and Filter Buttons
function initViewToggleButtons() {
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
    const individualOptions = document.getElementById('individualOptions');

    function deactivateAllViewButtons() {
        viewSystemsBtn.classList.remove('active');
        viewIndividualsBtn.classList.remove('active');
        compareHospitalsBtn.classList.remove('active');
    }

    viewSystemsBtn.addEventListener('click', () => {
        deactivateAllViewButtons();
        viewSystemsBtn.classList.add('active');
        individualOptions.style.display = 'none';
        applyAllFilters();
    });

    viewIndividualsBtn.addEventListener('click', () => {
        deactivateAllViewButtons();
        viewIndividualsBtn.classList.add('active');
        individualOptions.style.display = 'block';
        applyAllFilters();
    });

    compareHospitalsBtn.addEventListener('click', () => {
        deactivateAllViewButtons();
        compareHospitalsBtn.classList.add('active');
        individualOptions.style.display = 'none';
        window.location.href = 'compare.html';
    });
}

function initFilterButtons() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    function deactivateHospitalTypeButtons() {
        filterCriticalBtn.classList.remove('active');
        filterAcuteBtn.classList.remove('active');
    }

    filterCriticalBtn.addEventListener('click', () => {
        const isActive = filterCriticalBtn.classList.contains('active');
        deactivateHospitalTypeButtons();
        if (!isActive) {
            filterCriticalBtn.classList.add('active');
        }
        applyAllFilters();
    });

    filterAcuteBtn.addEventListener('click', () => {
        const isActive = filterAcuteBtn.classList.contains('active');
        deactivateHospitalTypeButtons();
        if (!isActive) {
            filterAcuteBtn.classList.add('active');
        }
        applyAllFilters();
    });

    document.getElementById('applyLocationBtn')?.addEventListener('click', () => {
        applyAllFilters();
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
        applyAllFilters();
    });

    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetAllFilters);

    document.getElementById('sortSelect')?.addEventListener('change', () => {
        sortAndRender(filteredHospitalData);
    });
}

// Main Filter Function
function applyAllFilters() {
    let filtered = [...hospitalData];

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
                    default: return JSON.stringify(hospital).toLowerCase().includes(val.toLowerCase());
                }
            });
        });
    }

    // Apply location filter
    const zip = document.getElementById('zipInput')?.value.trim();
    const radius = document.getElementById('radiusSelect')?.value;
    if (zip && /^\d{5}$/.test(zip)) {
        const coords = getZipCoords(zip);
        filtered = filtered.filter(hospital => {
            let lat = parseFloat(hospital.Latitude) || getZipCoords(hospital.Zip)[0];
            let lon = parseFloat(hospital.Longitude) || getZipCoords(hospital.Zip)[1];
            const distance = calculateDistance(coords[0], coords[1], lat, lon);
            return distance <= parseInt(radius);
        });
    }

    filteredHospitalData = filtered;
    sortAndRender(filteredHospitalData);
    updateMapMarkers(filteredHospitalData);
    updateMobileMapMarkers(filteredHospitalData);
}

// Helper function to get current selection
function getSelectedHospitalType() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    if (filterCriticalBtn?.classList.contains('active')) return 'Critical Access';
    if (filterAcuteBtn?.classList.contains('active')) return 'Acute Care';
    return null;
}

// Sorting Function
function sortAndRender(data) {
    const sortValue = document.getElementById('sortSelect')?.value;
    let sorted = [...data];

    if (sortValue === 'grade') {
        sorted.sort((a, b) => {
            const gradeOrder = {'A+': 12, 'A': 11, 'A-': 10, 'B+': 9, 'B': 8, 'B-': 7, 'C+': 6, 'C': 5, 'C-': 4, 'D+': 3, 'D': 2, 'D-': 1, 'F': 0, 'N/A': -1};
            const gradeA = a.TIER_1_GRADE_Lown_Composite || 'N/A';
            const gradeB = b.TIER_1_GRADE_Lown_Composite || 'N/A';
            return gradeOrder[gradeB] - gradeOrder[gradeA];
        });
    } else if (sortValue === 'name') {
        sorted.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    } else if (sortValue === 'size') {
        const sizeOrder = {'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5};
        sorted.sort((a, b) => {
            const sizeA = sizeOrder[a.Size] || 0;
            const sizeB = sizeOrder[b.Size] || 0;
            return sizeA - sizeB;
        });
    }

    renderHospitals(sorted);
}

// Reset Filters
function resetAllFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('zipInput').value = '';
    document.getElementById('radiusSelect').selectedIndex = 0;

    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    viewSystemsBtn?.classList.remove('active');
    viewIndividualsBtn?.classList.remove('active');
    filterCriticalBtn?.classList.remove('active');
    filterAcuteBtn?.classList.remove('active');

    filteredHospitalData = [...hospitalData];
    renderHospitals(hospitalData);
    updateMapMarkers(hospitalData);
    updateMobileMapMarkers(hospitalData);
}

// Page Initialization
function initIndexPage() {
    // Any index page specific initialization
}
