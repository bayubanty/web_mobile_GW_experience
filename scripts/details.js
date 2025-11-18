// ===============================
// Details Page Specific Functionality
// ===============================

let detailMap = null;

document.addEventListener('DOMContentLoaded', function() {
    initDetailsPage();
});

async function initDetailsPage() {
    try {
        // Load hospital data first
        await loadHospitalData();

        // Get hospital ID from URL
        const hospitalId = getUrlParam('id');
        if (!hospitalId) {
            showErrorPopup('No hospital specified.');
            return;
        }

        // Find and display hospital details
        const hospital = window.hospitalData.find(h => String(h.RECORD_ID) === String(hospitalId));
        if (!hospital) {
            showErrorPopup('Hospital not found.');
            return;
        }

        displayHospitalDetails(hospital);
    } catch (error) {
        console.error('Error initializing details page:', error);
        showErrorPopup('Failed to load hospital details.');
    }
}

function displayHospitalDetails(hospital) {
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
                xxl: "Extra Extra Large"
            };
            const sizeKey = String(hospital.Size || "").toLowerCase().trim();
            return sizeMap[sizeKey] || "---";
        })(),
        hospitalType: (() => {
            const types = [];
            if (hospital.TYPE_HospTyp_ACH) types.push("Acute Care Hospital");
            if (hospital.TYPE_HospTyp_CAH) types.push("Critical Access Hospital");
            if (hospital.TYPE_AMC) types.push("Academic Medical Center");
            if (hospital.TYPE_ForProfit) types.push("For-Profit");
            if (hospital.TYPE_NonProfit) types.push("Nonprofit");
            if (hospital.TYPE_chrch_affl_f) types.push("Faith-Affiliated");
            if (hospital.TYPE_isSafetyNet) types.push("Safety Net Hospital");
            return types.length ? types.join(", ") : "---";
        })(),
        hospitalCareLevel: (() => {
            if (hospital.TYPE_HospTyp_CAH) return "Critical Access";
            if (hospital.TYPE_HospTyp_ACH) return "Acute Care";
            if (hospital.TYPE_AMC) return "Academic / Teaching";
            return "---";
        })(),
        hospitalSystem: hospital.HOSPITAL_SYSTEM ? "Part of a Health System" : "Independent",
        hospitalUrbanRural: (() => {
            if (hospital.TYPE_urban) return "Urban";
            if (hospital.TYPE_rural) return "Rural";
            return "---";
        })(),
        hospitalBeds: hospital._original?.Bed_Size || hospital.Bed_Size || "---" // Get bed size from JSON
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
        affordabilityBillingStars: hospital.TIER_3_GRADE_Pat_Saf || "N/A",
        accessResponsibilityStars: hospital.TIER_3_GRADE_Pat_Exp || "N/A"
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

        // If no coordinates, approximate from ZIP code
        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
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

        const gmapsLink = document.getElementById("gmapsLink");
        if (gmapsLink) {
            gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        }
    }
}
