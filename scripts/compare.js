// ===============================
// Compare Page Functions
// ===============================

let selectedHospitals = {
    hospital1: null,
    hospital2: null
};

document.addEventListener('DOMContentLoaded', function() {
    // Load hospital data first
    loadHospitalData().then(() => {
        initComparePage();
    });

    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page === 'index') {
                window.location.href = 'index.html';
            } else if (page === 'methodology') {
                window.location.href = 'methodology.html';
            }
        });
    });
});

async function loadHospitalData() {
    try {
        const response = await fetch('../data/2025/2025_GW_HospitalScores.json');
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
        
    } catch (err) {
        console.error("Error loading JSON:", err);
        showErrorPopup('Error loading hospital data.');
    }
}

function initComparePage() {
    populateHospitalDropdowns();
    initializeCompareEventListeners();
}

function populateHospitalDropdowns() {
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    // Clear existing options except the first one
    while (hospital1Select.options.length > 1) hospital1Select.remove(1);
    while (hospital2Select.options.length > 1) hospital2Select.remove(1);

    // Sort hospitals by name for easier selection
    const sortedHospitals = [...hospitalData].sort((a, b) => {
        const nameA = a.Name || 'Unnamed Hospital';
        const nameB = b.Name || 'Unnamed Hospital';
        return nameA.localeCompare(nameB);
    });

    // Populate dropdowns
    sortedHospitals.forEach(hospital => {
        const name = hospital.Name || 'Unnamed Hospital';
        const location = `${hospital.City || ''}, ${hospital.State || ''}`;
        const optionText = `${name} - ${location}`;
        
        hospital1Select.add(new Option(optionText, hospital.RECORD_ID));
        hospital2Select.add(new Option(optionText, hospital.RECORD_ID));
    });
}

function initializeCompareEventListeners() {
    // Dropdown change events
    document.getElementById('hospital1Select').addEventListener('change', (e) => {
        const hospitalId = e.target.value;
        if (hospitalId) {
            const hospital = hospitalData.find(h => h.RECORD_ID == hospitalId);
            selectHospital(hospital, 'hospital1');
        } else {
            clearHospitalSelection('hospital1');
        }
    });

    document.getElementById('hospital2Select').addEventListener('change', (e) => {
        const hospitalId = e.target.value;
        if (hospitalId) {
            const hospital = hospitalData.find(h => h.RECORD_ID == hospitalId);
            selectHospital(hospital, 'hospital2');
        } else {
            clearHospitalSelection('hospital2');
        }
    });

    // Compare button
    document.getElementById('compareNowBtn').addEventListener('click', compareHospitals);

    // Clear selection
    document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);

    // Back to selection
    document.getElementById('backToSelectionBtn').addEventListener('click', backToSelection);

    // Category toggles
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
}

function selectHospital(hospital, slot) {
    selectedHospitals[slot] = hospital;
    updateSelectedHospitalDisplay(hospital, slot);
    updateCompareButton();
}

function clearHospitalSelection(slot) {
    selectedHospitals[slot] = null;
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    container.innerHTML = '<p class="placeholder">No hospital selected</p>';
    container.classList.remove('hospital-selected');
    updateCompareButton();
}

function updateSelectedHospitalDisplay(hospital, slot) {
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    const grade = hospital.TIER_1_GRADE_Lown_Composite || 'N/A';
    const stars = convertGradeToStars(grade);

    container.innerHTML = `
        <div class="hospital-preview">
            <h4>${hospital.Name || 'Unnamed Hospital'}</h4>
            <div class="location">${hospital.City || ''}, ${hospital.State || ''}</div>
            <div class="grade">
                Overall Grade:
                <div class="star-rating">${renderStars(stars.value)}</div>
            </div>
        </div>
    `;
    container.classList.add('hospital-selected');
}

function updateCompareButton() {
    const compareBtn = document.getElementById('compareNowBtn');
    const hasBothHospitals = selectedHospitals.hospital1 && selectedHospitals.hospital2;
    compareBtn.disabled = !hasBothHospitals;
}

function clearSelection() {
    selectedHospitals.hospital1 = null;
    selectedHospitals.hospital2 = null;

    // Reset displays
    document.getElementById('selectedHospital1').innerHTML = '<p class="placeholder">No hospital selected</p>';
    document.getElementById('selectedHospital2').innerHTML = '<p class="placeholder">No hospital selected</p>';
    document.getElementById('selectedHospital1').classList.remove('hospital-selected');
    document.getElementById('selectedHospital2').classList.remove('hospital-selected');

    // Reset dropdowns
    document.getElementById('hospital1Select').value = '';
    document.getElementById('hospital2Select').value = '';

    updateCompareButton();
    backToSelection();
}

function compareHospitals() {
    if (!selectedHospitals.hospital1 || !selectedHospitals.hospital2) return;

    // Hide selection section, show results
    document.querySelector('.selection-section').style.display = 'none';
    document.getElementById('comparisonResults').style.display = 'block';

    // Populate comparison
    populateComparison();
}

function backToSelection() {
    document.querySelector('.selection-section').style.display = 'block';
    document.getElementById('comparisonResults').style.display = 'none';
}

function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    header.classList.toggle('active');
    content.classList.toggle('active');
}

function populateComparison() {
    const comparisonGrid = document.getElementById('comparisonGrid');
    comparisonGrid.innerHTML = '';

    // Define comparison categories and metrics
    const categories = [
        {
            name: 'Overall Performance',
            metrics: [
                { key: 'TIER_1_GRADE_Lown_Composite', label: 'Overall Grade' },
                { key: 'Size', label: 'Hospital Size' },
                { key: 'TYPE_NonProfit', label: 'Hospital Type', format: (val) => val === 1 ? 'Non-profit' : 'For-profit' },
                { key: 'TYPE_urban', label: 'Setting', format: (val) => val === 1 ? 'Urban' : 'Rural' }
            ]
        },
        {
            name: 'Financial Transparency & Institutional Health',
            metrics: [
                { key: 'TIER_2_GRADE_Value', label: 'Value Grade' }
            ]
        },
        {
            name: 'Community Benefit Spending', 
            metrics: [
                { key: 'TIER_2_GRADE_Civic', label: 'Civic Leadership Grade' }
            ]
        },
        {
            name: 'Healthcare Affordability & Billing',
            metrics: [
                { key: 'TIER_3_GRADE_Pat_Exp', label: 'Patient Experience Grade' }
            ]
        },
        {
            name: 'Healthcare Access & Social Responsibility',
            metrics: [
                { key: 'TIER_3_GRADE_Pat_Saf', label: 'Patient Safety Grade' }
            ]
        },
        {
            name: 'Patient Outcomes & Experience',
            metrics: [
                { key: 'TIER_2_GRADE_Outcome', label: 'Outcome Grade' }
            ]
        }
    ];

    categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        comparisonGrid.appendChild(categoryElement);
    });
}

function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'comparison-category';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
        <h3>${category.name}</h3>
        <span class="category-toggle">▼</span>
    `;

    const content = document.createElement('div');
    content.className = 'category-content active';
    
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';

    category.metrics.forEach(metric => {
        const metricRow = createMetricRow(metric);
        metricsGrid.appendChild(metricRow);
    });

    content.appendChild(metricsGrid);
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(content);

    // Add click event for toggle
    header.addEventListener('click', toggleCategory);

    return categoryDiv;
}

function createMetricRow(metric) {
    const metricRow = document.createElement('div');
    metricRow.className = 'metric-row';

    const hospital1Value = getFormattedValue(selectedHospitals.hospital1, metric);
    const hospital2Value = getFormattedValue(selectedHospitals.hospital2, metric);

    metricRow.innerHTML = `
        <div class="metric-name">${metric.label}</div>
        <div class="metric-divider">vs</div>
        <div class="metric-values">
            <div class="metric-value hospital-1-value">
                <div class="metric-value-content">
                    ${isGradeMetric(metric.key) ?
                        `<div class="star-comparison">${renderStars(convertGradeToStars(selectedHospitals.hospital1[metric.key] || 'F').value)}</div>` :
                        `<span class="metric-value-text">${hospital1Value}</span>`
                    }
                </div>
            </div>
            <div class="metric-value hospital-2-value">
                <div class="metric-value-content">
                    ${isGradeMetric(metric.key) ?
                        `<div class="star-comparison">${renderStars(convertGradeToStars(selectedHospitals.hospital2[metric.key] || 'F').value)}</div>` :
                        `<span class="metric-value-text">${hospital2Value}</span>`
                    }
                </div>
            </div>
        </div>
    `;

    return metricRow;
}

function getFormattedValue(hospital, metric) {
    const value = hospital[metric.key];
    if (metric.format) {
        return metric.format(value);
    }
    if (value === null || value === undefined || value === 'NULL') {
        return 'N/A';
    }
    if (isGradeMetric(metric.key)) {
        return value;
    }
    return value;
}

function isGradeMetric(key) {
    return key.includes('GRADE');
}
