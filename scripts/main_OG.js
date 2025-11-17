// ===============================
// Original Baseline Version
// Main application logic - basic functionality
// ===============================

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Original version loaded');
    loadHospitalData();
});

// Basic data loading
async function loadHospitalData() {
    try {
        const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
        const data = await response.json();
        hospitalData = data.hospitals;
        filteredHospitalData = [...hospitalData];
        
        console.log('Hospital data loaded:', hospitalData.length, 'records');
        renderHospitals(hospitalData);
        
    } catch (err) {
        console.error("Error loading JSON:", err);
    }
}

// Basic rendering function
function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
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
            <strong>${hospital.Hospital_Name || 'Unnamed Hospital'}</strong><br>
            ${hospital.City || ''}, ${hospital.State || ''}
        `;
        row.appendChild(nameCell);
        
        // Buttons cell
        const buttonCell = document.createElement('td');
        buttonCell.classList.add('details-buttons');
        
        const fullDetailsButton = document.createElement('button');
        fullDetailsButton.textContent = 'View Full Details';
        fullDetailsButton.classList.add('view-full-detail');
        fullDetailsButton.addEventListener('click', () => {
            window.location.href = `details.html?id=${hospital.Hospital_ID}`;
        });
        
        buttonCell.appendChild(fullDetailsButton);
        row.appendChild(buttonCell);
        
        resultsTable.appendChild(row);
    });
}

// Basic utility functions
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
