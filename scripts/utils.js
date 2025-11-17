// ===============================
// Shared Utility Functions
// ===============================

// Global data storage
let hospitalData = [];
let filteredHospitalData = [];

// Page Navigation
function showPage(page) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => p.classList.remove('active'));

    // Show the selected page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        document.body.className = `${page}-page`;

        // Initialize page-specific functionality
        if (page === 'index') {
            initIndexPage();
        } else if (page === 'compare') {
            initComparePage();
        }
    }
}

// Star Rating Utilities
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
    return `<svg class="star full" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

function halfStarSVG() {
    return `<svg class="star half" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
            <linearGradient id="halfGradient" x1="0" x2="1">
                <stop offset="50%" stop-color="#f48810" />
                <stop offset="50%" stop-color="#a4cc95" />
            </linearGradient>
        </defs>
        <path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

function emptyStarSVG() {
    return `<svg class="star empty" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

// Distance Calculation
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

// ZIP-Based Coordinate Approximation
function getZipCoords(zip) {
    const lookup = {
        '31513': [33.54609, -82.3163154],
        '31510': [31.538626, -82.459238],
        '30830': [33.0833, -82.0134],
        '30301': [33.749, -84.388],
        '30309': [33.80915, -84.39547],
        '31701': [31.59022, -84.15779],
        '30342': [33.908404, -84.354543],
        '30180': [33.56995, -85.07421],
        '30322': [33.7954, -84.3202],
        '30606': [34.16608, -83.4013],
        '30060': [33.96795, -84.55135],
    };
    return lookup[String(zip)] || [32.5, -83.5];
}

// Error Popup Utility
function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('visible'), 10);
    setTimeout(() => {
        popup.classList.remove('visible');
        setTimeout(() => popup.remove(), 400);
    }, 4000);
}

// Convert 1-5 ratings to A-F grades
function convertRatingToGrade(rating) {
    if (!rating || rating === 'N/A') return 'N/A';
    const gradeMap = {5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F'};
    return gradeMap[rating] || 'N/A';
}
