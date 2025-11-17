// ===============================
// Hospital Details Page
// ===============================

let hospitalData = [];
let currentHospital = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load hospital data and initialize details page
    loadHospitalData();
    
    // Set up back button
    document.getElementById('backToResults').addEventListener('click', function(e) {
        e.preventDefault();
        window.history.back();
    });
});

async function loadHospitalData() {
    try {
        // Get hospital ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hospitalId = urlParams.get('id');
        
        if (!hospitalId) {
            showError('Hospital ID not specified in URL');
            return;
        }

        // Load hospital data
        const response = await fetch('data/2025/2025_GW_HospitalScores.json');
        const jsonData = await response.json();
        
        // Find the specific hospital
        const hospital = jsonData.find(h => h.Hospital_ID == hospitalId);
        
        if (!hospital) {
            showError('Hospital not found');
            return;
        }

        currentHospital = hospital;
        populateHospitalDetails(hospital);

    } catch (err) {
        console.error("Error loading hospital details:", err);
        showError('Error loading hospital details');
    }
}

function populateHospitalDetails(hospital) {
    // Populate basic hospital info
    document.getElementById('hospitalName').textContent = hospital.Hospital_Name || 'Unnamed Hospital';
    document.getElementById('streetLine').textContent = hospital.Street_Address || '---';
    document.getElementById('cityStateZip').textContent = [hospital.City, hospital.State, hospital.ZIP_Code].filter(Boolean).join(', ');

    // Hospital Info
    const infoMap = {
        hospitalCounty: hospital.County || '---',
        hospitalSize: (() => {
            const sizeMap = {
                'XS': "Extra Small",
                'S': "Small", 
                'M': "Medium",
                'L': "Large",
                'XL': "Extra Large",
                'XXL': "Extra Extra Large"
            };
            return sizeMap[hospital.Size_Group] || "---";
        })(),
        hospitalType: hospital.Ownership_Type || '---',
        hospitalCareLevel: hospital.Care_Level || '---',
        hospitalSystem: hospital.System_Name || 'Independent',
        hospitalUrbanRural: hospital.Urban_Rural || '---',
        hospitalBeds: hospital.Bed_Size ? hospital.Bed_Size.toString() : '---'
    };

    // Apply infoMap values to page
    for (const [id, val] of Object.entries(infoMap)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // Services
    const list = document.getElementById('hospitalServices');
    list.innerHTML = '';

    // Default fallback list if dataset has no service info
    let services = [
        "Behavioral Health",
        "Cardiology", 
        "Emergency Care",
        "Imaging & Radiology",
        "Maternity & Neonatal ICU",
        "Oncology",
        "Orthopedics",
        "Outpatient Surgery",
        "Pediatric Services",
        "Pharmacy",
        "Physical Therapy",
        "Rehabilitation"
    ];

    list.innerHTML = services.map(s => `<li>${s}</li>`).join('');

    // Overall Grade
    const overallGrade = convertRatingToGrade(hospital.Overall_Star_Rating);
    const starWrap = document.getElementById('overallStars');
    if (starWrap) {
        starWrap.innerHTML = renderStars(
            convertGradeToStars(overallGrade).value
        );
    }

    // Hide redundant text
    const gradeText = document.getElementById('overallGradeText');
    if (gradeText) gradeText.textContent = "";

    // Category-level stars
    const categoryMap = {
        financialTransparencyStars: convertRatingToGrade(hospital.FTIH_Category_Rating),
        communityBenefitStars: convertRatingToGrade(hospital.CBS_Category_Rating),
        affordabilityBillingStars: convertRatingToGrade(hospital.HAB_Category_Rating),
        accessResponsibilityStars: convertRatingToGrade(hospital.HASR_Category_Rating)
    };

    for (const [id, grade] of Object.entries(categoryMap)) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = renderStars(convertGradeToStars(grade).value);
    }

    // Map
    const mapDiv = document.getElementById('leafletMap');
    if (mapDiv) {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        if (!lat || !lon) {
            // Use ZIP code approximation if coordinates not available
            const coords = getZipCoords(hospital.ZIP_Code);
            lat = coords[0];
            lon = coords[1];
        }

        // Clear any existing map
        if (window.detailMap) {
            window.detailMap.remove();
        }

        window.detailMap = L.map('leafletMap').setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(window.detailMap);

        L.marker([lat, lon]).addTo(window.detailMap).bindPopup(hospital.Hospital_Name || 'Unnamed Hospital');

        document.getElementById("gmapsLink").href = 
            `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
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

// Star rating utilities (same as main.js)
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

// ZIP coordinate lookup (same as main.js)
function getZipCoords(zip) {
    const lookup = {
        '31513': [33.54609, -82.3163154], // Baxley
        '31510': [31.538626, -82.459238], // Alma
        '30830': [33.0833, -82.0134], // Waynesboro
        '30301': [33.749, -84.388], // Atlanta
        '30309': [33.80915, -84.39547], // Atlanta
        '31701': [31.59022, -84.15779], // Albany
        '30342': [33.908404, -84.354543], // Atlanta
        '30180': [33.56995, -85.07421], // Villa Rica
        '30322': [33.7954, -84.3202], // Atlanta
        '30606': [34.16608, -83.4013], // Athens
        '30060': [33.96795, -84.55135], // Marietta
    };
    const coords = lookup[String(zip)] || [32.5, -83.5];
    return coords;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-popup visible';
    errorDiv.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
