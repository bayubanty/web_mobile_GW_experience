// ===============================
// Compare Page Functions
// ===============================
let hospitalData = [];
let selectedHospitals = {
    hospital1: null,
    hospital2: null
};

document.addEventListener('DOMContentLoaded', function() {
    initComparePage();
});

async function initComparePage() {
    try {
        await loadHospitalData();
        populateHospitalDropdowns();
        initializeCompareEventListeners();
    } catch (err) {
        console.error("Error initializing compare page:", err);
        showError('Error loading hospital data');
    }
}

async function loadHospitalData() {
    try {
        const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
        const data = await response.json();
        hospitalData = data.hospitals;
    } catch (err) {
        console.error("Error loading hospital data:", err);
        throw err;
    }
}

function populateHospitalDropdowns() {
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    // Clear existing options except the first one
    while (hospital1Select.options.length > 1) {
        hospital1Select.remove(1);
    }
    while (hospital2Select.options.length > 1) {
        hospital2Select.remove(1);
    }

    // Sort hospitals by name for easier selection
    const sortedHospitals = [...hospitalData].sort((a, b) => {
        const nameA = a.Hospital_Name || 'Unnamed Hospital';
        const nameB = b.Hospital_Name || 'Unnamed Hospital';
        return nameA.localeCompare(nameB);
    });

    // Populate dropdowns
    sortedHospitals.forEach(hospital => {
        const name = hospital.Hospital_Name || 'Unnamed Hospital';
        const location = `${hospital.City || ''}, ${hospital.State || ''}`;
        const optionText = `${name} - ${location}`;

        const option1 = new Option(optionText, hospital.Hospital_ID);
        const option2 = new Option(optionText, hospital.Hospital_ID);

        hospital1Select.add(option1);
        hospital2Select.add(option2);
    });
}

function initializeCompareEventListeners() {
    // Dropdown change events
    document.getElementById('hospital1Select').addEventListener('change', (e) => {
        const hospitalId = e.target.value;
        if (hospitalId) {
            const hospital = hospitalData.find(h => h.Hospital_ID == hospitalId);
            selectHospital(hospital, 'hospital1');
        } else {
            clearHospitalSelection('hospital1');
        }
    });

    document.getElementById('hospital2Select').addEventListener('change', (e) => {
        const hospitalId = e.target.value;
        if (hospitalId) {
            const hospital = hospitalData.find(h => h.Hospital_ID == hospitalId);
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
    const grade = convertRatingToGrade(hospital.Overall_Star_Rating);
    const stars = convertGradeToStars(grade);

    container.innerHTML = `
    <div class="hospital-preview">
        <h4>${hospital.Hospital_Name || 'Unnamed Hospital'}</h4>
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

function populateComparison() {
    const comparisonGrid = document.getElementById('comparisonGrid');
    comparisonGrid.innerHTML = '';

    // Define comparison categories and metrics
    const categories = [
        {
            name: 'Overall Performance',
            metrics: [
                { key: 'Overall_Star_Rating', label: 'Overall Grade', format: (val) => convertRatingToGrade(val) },
                { key: 'Bed_Size', label: 'Bed Size' },
                { key: 'Ownership_Type', label: 'Hospital Type' },
                { key: 'Urban_Rural', label: 'Setting' }
            ]
        },
        {
            name: 'Financial Transparency & Institutional Health',
            metrics: [
                { key: 'FTIH_Category_Rating', label: 'Financial Transparency Grade', format: (val) => convertRatingToGrade(val) },
                { key: 'Balance_Growth', label: 'Balance Growth', format: (val) => convertRatingToGrade(val) },
                { key: 'Transparency', label: 'Transparency', format: (val) => convertRatingToGrade(val) },
                { key: 'Fiscal_Health', label: 'Fiscal Health', format: (val) => convertRatingToGrade(val) },
                { key: 'Staffing', label: 'Staffing', format: (val) => convertRatingToGrade(val) }
            ]
        },
        {
            name: 'Community Benefit Spending',
            metrics: [
                { key: 'CBS_Category_Rating', label: 'Community Benefit Grade', format: (val) => convertRatingToGrade(val) },
                { key: 'Tax_Benefit', label: 'Tax Benefit', format: (val) => convertRatingToGrade(val) },
                { key: 'Quality_of_CBS', label: 'Quality of CBS', format: (val) => convertRatingToGrade(val) },
                { key: 'Strategic_Use', label: 'Strategic Use', format: (val) => convertRatingToGrade(val) }
            ]
        },
        {
            name: 'Healthcare Affordability & Billing',
            metrics: [
                { key: 'HAB_Category_Rating', label: 'Affordability Grade', format: (val) => convertRatingToGrade(val) },
                { key: 'Financial_Burden', label: 'Financial Burden', format: (val) => convertRatingToGrade(val) },
                { key: 'Charity_Care', label: 'Charity Care', format: (val) => convertRatingToGrade(val) },
                { key: 'Medical_Debt', label: 'Medical Debt', format: (val) => convertRatingToGrade(val) }
            ]
        },
        {
            name: 'Healthcare Access & Social Responsibility',
            metrics: [
                { key: 'HASR_Category_Rating', label: 'Access & Responsibility Grade', format: (val) => convertRatingToGrade(val) },
                { key: 'Range_of_Services', label: 'Range of Services', format: (val) => convertRatingToGrade(val) },
                { key: 'Demographic_Alignment', label: 'Demographic Alignment', format: (val) => convertRatingToGrade(val) },
                { key: 'Workforce_Training', label: 'Workforce Training', format: (val) => convertRatingToGrade(val) },
                { key: 'Pay_Equity_Ratio', label: 'Pay Equity Ratio', format: (val) => convertRatingToGrade(val) }
            ]
        }
    ];

    categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        comparisonGrid.appendChild(categoryElement);
    });

    // Add click events for category toggles
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
}

function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'comparison-category';

    const header = document.createElement('div');
    header.className = 'category-header active';
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

    return categoryDiv;
}

function createMetricRow(metric) {
    const metricRow = document.createElement('div');
    metricRow.className = 'metric-row';

    const hospital1Value = getFormattedValue(selectedHospitals.hospital1, metric);
    const hospital2Value = getFormattedValue(selectedHospitals.hospital2, metric);

    const isGradeMetric = metric.key.includes('Rating') || metric.key.includes('Grade') || 
                         metric.key === 'Balance_Growth' || metric.key === 'Transparency' || 
                         metric.key === 'Fiscal_Health' || metric.key === 'Staffing' ||
                         metric.key === 'Tax_Benefit' || metric.key === 'Quality_of_CBS' ||
                         metric.key === 'Strategic_Use' || metric.key === 'Financial_Burden' ||
                         metric.key === 'Charity_Care' || metric.key === 'Medical_Debt' ||
                         metric.key === 'Range_of_Services' || metric.key === 'Demographic_Alignment' ||
                         metric.key === 'Workforce_Training' || metric.key === 'Pay_Equity_Ratio';

    metricRow.innerHTML = `
        <div class="metric-name">${metric.label}</div>
        <div class="metric-divider">vs</div>
        <div class="metric-values">
            <div class="metric-value hospital-1-value">
                <div class="metric-value-content">
                    ${isGradeMetric ? 
                        `<div class="star-comparison">${renderStars(convertGradeToStars(hospital1Value).value)}</div>` :
                        `<span class="metric-value-text">${hospital1Value}</span>`
                    }
                </div>
            </div>
            <div class="metric-value hospital-2-value">
                <div class="metric-value-content">
                    ${isGradeMetric ? 
                        `<div class="star-comparison">${renderStars(convertGradeToStars(hospital2Value).value)}</div>` :
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

    return value;
}

function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    
    header.classList.toggle('active');
    content.classList.toggle('active');
    
    const toggle = header.querySelector('.category-toggle');
    toggle.textContent = header.classList.contains('active') ? '▼' : '▲';
}

// Helper function to convert 1-5 ratings to A-F grades
function convertRatingToGrade(rating) {
    if (!rating || rating === 'N/A') return 'N/A';
    const gradeMap = {
        5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F'
    };
    return gradeMap[rating] || 'N/A';
}

function convertGradeToStars(grade) {
    const gradeMap = {
        'A+': 5, 'A': 5, 'A-': 4.5,
        'B+': 4.5, 'B': 4, 'B-': 3.5,
        'C+': 3.5, 'C': 3, 'C-': 2.5,
        'D+': 2.5, 'D': 2, 'D-': 1.5,
        'F': 1, 'N/A': 0
    };

    const value = gradeMap[grade] || 0;
    return { value };
}

function renderStars(value) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (value >= i) {
            html += fullStarSVG();
        } else if (value >= i - 0.5) {
            html += halfStarSVG();
        } else {
            html += emptyStarSVG();
        }
    }
    return html;
}

function fullStarSVG() {
    return `
    <svg class="star full" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>
    `;
}

function halfStarSVG() {
    return `
    <svg class="star half" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
            <linearGradient id="halfGradient" x1="0" x2="1">
                <stop offset="50%" stop-color="#f48810" />
                <stop offset="50%" stop-color="#a4cc95" />
            </linearGradient>
        </defs>
        <path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>
    `;
}

function emptyStarSVG() {
    return `
    <svg class="star empty" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>
    `;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-popup visible';
    errorDiv.innerHTML = `<p>${message}</p>`;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1002;
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
