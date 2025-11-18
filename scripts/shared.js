// ===============================
// Shared Utilities and Data Management
// ===============================

// Global hospital data storage
window.hospitalData = null;
window.filteredHospitalData = null;

// ===============================
// Data Loading
// ===============================

async function loadHospitalData() {
    try {
        if (window.hospitalData) {
            return window.hospitalData;
        }

        console.log("Loading hospital data...");
        
        // NEW PATH: Direct file in same directory
        const response = await fetch('2025_GW_HospitalScores.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const hospitalArray = await response.json();
        console.log("JSON loaded successfully:", hospitalArray.length, "hospitals");

        // Transform the data to match expected property names
        window.hospitalData = hospitalArray.map(hospital => ({
            RECORD_ID: hospital.Hospital_ID,
            Name: hospital.Hospital_Name,
            Address: hospital.Street_Address,
            City: hospital.City,
            State: hospital.State,
            Zip: hospital.ZIP_Code,
            County: hospital.County,
            Latitude: hospital.Latitude,
            Longitude: hospital.Longitude,
            TIER_1_GRADE_Lown_Composite: convertRatingToGrade(hospital.Overall_Star_Rating),
            TIER_2_GRADE_Outcome: convertRatingToGrade(hospital.FTIH_Category_Rating),
            TIER_2_GRADE_Value: convertRatingToGrade(hospital.CBS_Category_Rating),
            TIER_2_GRADE_Civic: convertRatingToGrade(hospital.HAB_Category_Rating),
            TIER_3_GRADE_Pat_Saf: convertRatingToGrade(hospital.HASR_Category_Rating),
            TIER_3_GRADE_Pat_Exp: convertRatingToGrade(hospital.Overall_Star_Rating),
            TYPE_urban: hospital.Urban_Rural === 'Urban' ? 1 : 0,
            TYPE_rural: hospital.Urban_Rural === 'Rural' ? 1 : 0,
            TYPE_NonProfit: hospital.Ownership_Type === 'Nonprofit' ? 1 : 0,
            TYPE_ForProfit: hospital.Ownership_Type === 'For Profit' ? 1 : 0,
            TYPE_HospTyp_CAH: hospital.Care_Level === 'Primary' ? 1 : 0,
            TYPE_HospTyp_ACH: hospital.Care_Level === 'Acute Care' || hospital.Care_Level === 'Regional Referral' || hospital.Care_Level === 'Specialty' ? 1 : 0,
            Size: hospital.Size_Group ? hospital.Size_Group.toLowerCase() : 'm',
            Bed_Size: hospital.Bed_Size, // Preserve bed size
            HOSPITAL_SYSTEM: hospital.In_System === 1,
            _original: hospital
        }));

        window.filteredHospitalData = [...window.hospitalData];
        console.log("Hospital data transformed:", window.hospitalData.length, "records");
        return window.hospitalData;
    } catch (err) {
        console.error("Error loading hospital data:", err);
        showErrorPopup('Failed to load hospital data. Please check the console.');
        return [];
    }
}

// Helper function to convert 1-5 ratings to A-F grades
function convertRatingToGrade(rating) {
    if (!rating || rating === 'N/A') return 'N/A';
    
    const gradeMap = {
        5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F'
    };
    
    return gradeMap[rating] || 'N/A';
}

// ===============================
// Star Rating Utilities
// ===============================

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

// ===============================
// ZIP-Based Coordinate Approximation
// ===============================

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
        '30439': [32.0809, -81.0912],
        '31634': [31.0339, -82.76445],
        '31533': [31.5047, -82.8586],
        '31768': [31.1621, -83.7921],
        '31015': [31.97761, -83.781268],
        '31023': [32.18507, -83.17896],
        '39845': [31.05102, -84.88167],
        '31750': [31.69762, -83.25991],
        '30458': [32.4488, -81.7832],
        '31329': [32.36369, -81.32069],
        '30635': [34.11332, -82.87487],
        '30401': [32.59258, -82.34732],
        '30417': [32.1589, -81.9043],
        '31774': [31.60329, -83.25134],
        '31064': [33.31422, -83.6864],
        '31539': [31.85727, -82.60728],
        '30434': [32.121, -82.412],
        '31313': [31.8469, -81.5959],
        '39837': [31.1713, -84.7338],
        '31029': [33.0309, -83.945],
        '30650': [33.5849, -83.4807],
        '30577': [34.5787, -83.3324],
        '31036': [32.4745, -83.7406],
        '31794': [31.4605, -83.5228],
        '30286': [32.8818, -84.3278],
        '31830': [32.8944, -84.6786],
        '31082': [32.9956, -82.8044],
        '30720': [34.7889, -84.985],
        '31501': [31.2249, -82.348],
        '30041': [34.2073, -84.1402],
        '30115': [34.2368, -84.4908],
        '30117': [33.5707, -85.0732],
        '30240': [33.0454, -85.031],
        '30014': [33.6018, -83.8487],
        '30701': [34.5103, -84.931],
        '31412': [32.0809, -81.0912]
    };
    const coords = lookup[String(zip)] || [32.5, -83.5];
    return coords;
}

// ===============================
// Distance Calculation
// ===============================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===============================
// Error Popup Utility
// ===============================

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

// ===============================
// URL Parameter Utilities
// ===============================

function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function setUrlParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url);
}

// ===============================
// Mobile Navigation
// ===============================

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
