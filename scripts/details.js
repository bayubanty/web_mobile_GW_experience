// ===============================
// Hospital Details Page Logic
// ===============================

let detailMap = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load hospital data first
    loadHospitalData().then(() => {
        // Get hospital ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hospitalId = urlParams.get('id');
        
        if (hospitalId) {
            showHospitalDetails(hospitalId);
        } else {
            showErrorPopup('No hospital ID specified.');
        }
    });

    // Set up back button
    document.getElementById('backToResults')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
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

function showHospitalDetails(hospitalId) {
    const hospital = hospitalData.find(h => String(h.RECORD_ID) === String(hospitalId));
    if (!hospital) {
        showErrorPopup('Hospital details not found.');
        return;
    }

    // Populate hospital details
    document.getElementById('hospitalName').textContent = hospital.Name || 'Unnamed Hospital';
    document.getElementById('streetLine').textContent = hospital.Address || '---';
    document.getElementById('cityStateZip').textContent = [hospital.City, hospital.State, hospital.Zip].filter(Boolean).join(', ');

    // Hospital Info
    const infoMap = {
        hospitalCounty: hospital.County || '---',
        hospitalSize: (() => {
            const sizeMap = {
                xs: "Extra Small",
                s: "Small", 
                m: "Medium",
                l: "Large",
                xl: "Extra Large",
                xxl: "Extra Large"
            };
            const sizeKey = String(hospital.Size || "").toLowerCase().trim();
            return sizeMap[sizeKey] || "---";
        })(),
        hospitalType: (() => {
            const types = [];
            if (hospital.TYPE_HospTyp_ACH) types.push("Acute Care Hospital");
            if (hospital.TYPE_HospTyp_CAH) types.push("Critical Access Hospital");
            if (hospital.TYPE_NonProfit) types.push("Nonprofit");
            if (hospital.TYPE_ForProfit) types.push("For-Profit");
            return types.length ? types.join(", ") : "---";
        })(),
        hospitalCareLevel: (() => {
            if (hospital.TYPE_HospTyp_CAH) return "Critical Access";
            if (hospital.TYPE_HospTyp_ACH) return "Acute Care";
            return "---";
        })(),
        hospitalSystem: hospital.HOSPITAL_SYSTEM ? "Part of a Health System" : "Independent",
        hospitalUrbanRural: (() => {
            if (hospital.TYPE_urban) return "Urban";
            if (hospital.TYPE_rural) return "Rural";
            return "---";
        })(),
        hospitalBeds: hospital._original?.Bed_Size ? hospital._original.Bed_Size.toString() : "---"
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
    const overallGrade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const starWrap = document.getElementById('overallStars');
    if (starWrap) {
        starWrap.innerHTML = renderStars(convertGradeToStars(overallGrade).value);
    }

    // Category-level stars
    const categoryMap = {
        financialTransparencyStars: hospital.TIER_2_GRADE_Value || "N/A",
        communityBenefitStars: hospital.TIER_2_GRADE_Civic || "N/A", 
        affordabilityBillingStars: hospital.TIER_3_GRADE_Pat_Exp || "N/A",
        accessResponsibilityStars: hospital.TIER_3_GRADE_Pat_Saf || "N/A"
    };

    for (const [id, grade] of Object.entries(categoryMap)) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = renderStars(convertGradeToStars(grade).value);
    }

    // Initialize map
    initDetailMap(hospital);
}

function initDetailMap(hospital) {
    const mapDiv = document.getElementById('leafletMap');
    if (!mapDiv) return;

    let lat = parseFloat(hospital.Latitude);
    let lon = parseFloat(hospital.Longitude);
    
    if (!lat || !lon) {
        const coords = getZipCoords(hospital.Zip);
        lat = coords[0];
        lon = coords[1];
    }

    // Clear any existing map
    if (detailMap) {
        detailMap.remove();
    }

    detailMap = L.map('leafletMap').setView([lat, lon], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(detailMap);
    
    L.marker([lat, lon]).addTo(detailMap).bindPopup(hospital.Name || 'Unnamed Hospital');
    
    // Google Maps link
    const gmapsLink = document.getElementById("gmapsLink");
    if (gmapsLink) {
        gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
}
