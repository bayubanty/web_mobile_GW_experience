// ===============================
// Enhanced Version with Loading States
// ===============================

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];
let isLoading = false;

// Initialize application with loading states
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced version with loader loaded');
    showLoadingState();
    loadHospitalData();
});

// Show loading state
function showLoadingState() {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = 'Loading hospitals...';
    resultsTable.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p>Loading hospital data...</p>
            </td>
        </tr>
    `;
    
    // Add loading spinner styles if not already present
    if (!document.querySelector('#loadingStyles')) {
        const styles = document.createElement('style');
        styles.id = 'loadingStyles';
        styles.textContent = `
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
        document.head.appendChild(styles);
    }
}

// Enhanced data loading with error handling
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
        renderHospitals(hospitalData);
        hideLoadingState();
        
    } catch (err) {
        console.error("Error loading JSON:", err);
        showErrorState('Failed to load hospital data. Please try again later.');
    } finally {
        isLoading = false;
    }
}

// Hide loading state
function hideLoadingState() {
    const resultsCount = document.getElementById('resultsCount');
    resultsCount.textContent = `Viewing ${hospitalData.length} results`;
}

// Show error state
function showErrorState(message) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = 'Error loading data';
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

// Enhanced rendering with more details
function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsTable.innerHTML = '';
    resultsCount.textContent = `Viewing ${data.length} results`;
    
    if (!data.length) {
        resultsTable.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3>No Hospitals Found</h3>
                    <p>Try adjusting your filters to see more results.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    data.forEach(hospital => {
        const row = document.createElement('tr');
        row.classList.add('hospital-row');
        
        // Grade cell with enhanced display
        const gradeCell = document.createElement('td');
        const grade = convertRatingToGrade(hospital.Overall_Star_Rating);
        const stars = convertGradeToStars(grade);
        gradeCell.innerHTML = `
            <div class="star-rating" aria-label="${stars.value} out of 5 stars">
                ${renderStars(stars.value)}
            </div>
            <small style="display: block; margin-top: 4px; color: #666;">${grade}</small>
        `;
        row.appendChild(gradeCell);
        
        // Enhanced name cell with more info
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <strong style="font-size: 1.1em;">
                ${hospital.Hospital_Name || 'Unnamed Hospital'}
            </strong>
            <div style="color: #666; margin: 4px 0;">
                ${hospital.City || ''}, ${hospital.State || ''}
            </div>
            <div style="font-size: 0.9em; color: #888;">
                ${hospital.Urban_Rural || ''} • ${hospital.Ownership_Type || ''}
            </div>
        `;
        row.appendChild(nameCell);
        
        // Enhanced buttons cell
        const buttonCell = document.createElement('td');
        buttonCell.classList.add('details-buttons');
        
        const quickViewBtn = document.createElement('button');
        quickViewBtn.textContent = 'Quick View';
        quickViewBtn.classList.add('toggle-detail');
        quickViewBtn.style.marginBottom = '8px';
        
        const fullDetailsBtn = document.createElement('button');
        fullDetailsBtn.textContent = 'Full Details';
        fullDetailsBtn.classList.add('view-full-detail');
        fullDetailsBtn.addEventListener('click', () => {
            window.location.href = `details.html?id=${hospital.Hospital_ID}`;
        });
        
        const compareBtn = document.createElement('button');
        compareBtn.textContent = 'Compare';
        compareBtn.style.background = '#6c757d';
        compareBtn.classList.add('view-full-detail');
        compareBtn.addEventListener('click', () => {
            // Add to comparison functionality
            alert(`Added ${hospital.Hospital_Name} to comparison`);
        });
        
        buttonCell.appendChild(quickViewBtn);
        buttonCell.appendChild(fullDetailsBtn);
        buttonCell.appendChild(compareBtn);
        row.appendChild(buttonCell);
        
        resultsTable.appendChild(row);
    });
}

// Enhanced utility functions
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
    return `<svg class="star full" viewBox="0 0 24 24" width="20" height="20"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>`;
}

function halfStarSVG() {
    return `<svg class="star half" viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="halfGradient"><stop offset="50%" stop-color="#f48810"/><stop offset="50%" stop-color="#a4cc95"/></linearGradient></defs><path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>`;
}

function emptyStarSVG() {
    return `<svg class="star empty" viewBox="0 0 24 24" width="20" height="20"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>`;
}
