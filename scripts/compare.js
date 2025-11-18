// ===============================
// Compare Page Specific Functionality
// ===============================

let selectedHospitals = {
    hospital1: null,
    hospital2: null
};

document.addEventListener('DOMContentLoaded', function() {
    initComparePage();
});

async function initComparePage() {
    try {
        // Load hospital data first
        await loadHospitalData();
        
        // Initialize compare page
        populateHospitalDropdowns();
        initializeCompareEventListeners();
        
    } catch (error) {
        console.error('Error initializing compare page:', error);
        showErrorPopup('Failed to load hospital data.');
    }
}

function populateHospitalDropdowns() {
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    if (!hospital1Select || !hospital2Select || !window.hospitalData) return;

    // Clear existing options except the first one
    while (hospital1Select.options.length > 1) {
        hospital1Select.remove(1);
    }
    while (hospital2Select.options.length > 1) {
        hospital2Select.remove(1);
    }

    // Sort hospitals by name for easier selection
    const sortedHospitals = [...window.hospitalData].sort((a, b) => {
        const nameA = a.Name || 'Unnamed Hospital';
        const nameB = b.Name || 'Unnamed Hospital';
        return nameA.localeCompare(nameB);
    });

    // Populate dropdowns
    sortedHospitals.forEach(hospital => {
        const name = hospital.Name || 'Unnamed Hospital';
        const location = `${hospital.City || ''}, ${hospital.State || ''}`;
        const optionText = `${name} - ${location}`;
        const option1 = new Option(optionText, hospital.RECORD_ID);
        const option2 = new Option(optionText, hospital.RECORD_ID);
        hospital1Select.add(option1);
        hospital2Select.add(option2);
    });
}

function initializeCompareEventListeners() {
    // Dropdown change events
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    if (hospital1Select) {
        hospital1Select.addEventListener('change', (e) => {
            const hospitalId = e.target.value;
            if (hospitalId) {
                const hospital = window.hospitalData.find(h => h.RECORD_ID == hospitalId);
                selectHospital(hospital, 'hospital1');
            } else {
                clearHospitalSelection('hospital1');
            }
        });
    }

    if (hospital2Select) {
        hospital2Select.addEventListener('change', (e) => {
            const hospitalId = e.target.value;
            if (hospitalId) {
                const hospital = window.hospitalData.find(h => h.RECORD_ID == hospitalId);
                selectHospital(hospital, 'hospital2');
            } else {
                clearHospitalSelection('hospital2');
            }
        });
    }

    // Compare button
    const compareNowBtn = document.getElementById('compareNowBtn');
    if (compareNowBtn) {
        compareNowBtn.addEventListener('click', compareHospitals);
    }

    // Clear selection
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearSelection);
    }

    // Back to selection
    const backToSelectionBtn = document.getElementById('backToSelectionBtn');
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', backToSelection);
    }

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
    if (container) {
        container.innerHTML = '<p class="placeholder">No hospital selected</p>';
        container.classList.remove('hospital-selected');
    }
    updateCompareButton();
}

function updateSelectedHospitalDisplay(hospital, slot) {
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    if (!container) return;

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
    if (!compareBtn) return;

    const hasBothHospitals = selectedHospitals.hospital1 && selectedHospitals.hospital2;
    compareBtn.disabled = !hasBothHospitals;
}

function clearSelection() {
    selectedHospitals.hospital1 = null;
    selectedHospitals.hospital2 = null;

    // Reset displays
    const selectedHospital1 = document.getElementById('selectedHospital1');
    const selectedHospital2 = document.getElementById('selectedHospital2');
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    if (selectedHospital1) {
        selectedHospital1.innerHTML = '<p class="placeholder">No hospital selected</p>';
        selectedHospital1.classList.remove('hospital-selected');
    }
    if (selectedHospital2) {
        selectedHospital2.innerHTML = '<p class="placeholder">No hospital selected</p>';
        selectedHospital2.classList.remove('hospital-selected');
    }
    if (hospital1Select) hospital1Select.value = '';
    if (hospital2Select) hospital2Select.value = '';

    updateCompareButton();
    backToSelection();
}

function compareHospitals() {
    if (!selectedHospitals.hospital1 || !selectedHospitals.hospital2) return;

    // Hide selection section, show results
    const selectionSection = document.querySelector('.selection-section');
    const comparisonResults = document.getElementById('comparisonResults');
    
    if (selectionSection) selectionSection.style.display = 'none';
    if (comparisonResults) comparisonResults.style.display = 'block';

    // Populate comparison
    populateComparison();
}

function backToSelection() {
    const selectionSection = document.querySelector('.selection-section');
    const comparisonResults = document.getElementById('comparisonResults');
    
    if (selectionSection) selectionSection.style.display = 'block';
    if (comparisonResults) comparisonResults.style.display = 'none';
}

function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    header.classList.toggle('active');
    content.classList.toggle('active');
}

function populateComparison() {
    const comparisonGrid = document.getElementById('comparisonGrid');
    if (!comparisonGrid) return;

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
                { key: 'TIER_2_GRADE_Civic', label: 'Community Benefit Grade' }
            ]
        },
        {
            name: 'Healthcare Affordability & Billing',
            metrics: [
                { key: 'TIER_3_GRADE_Pat_Saf', label: 'Cost Effectiveness Grade' }
            ]
        },
        {
            name: 'Healthcare Access & Social Responsibility',
            metrics: [
                { key: 'TIER_3_GRADE_Pat_Exp', label: 'Inclusivity Grade' }
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
    if (!hospital) return 'N/A';
    
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
