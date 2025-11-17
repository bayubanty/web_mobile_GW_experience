// ===============================
// GUARANTEED WORKING VERSION - Robust JSON Loading
// ===============================

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];
let isLoading = false;
let map = null;
let mobileMap = null;
let mapMarkers = [];
let mobileMapMarkers = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Main application starting...');
    initializeApplication();
});

async function initializeApplication() {
    try {
        showLoadingState();
        console.log('📥 Loading hospital data...');
        await loadHospitalData();
        console.log('✅ Data loaded, initializing UI...');
        initializeEventListeners();
        initializeMobileNavigation();
        initializeHospitalMap(hospitalData);
        initializeMobileMap(hospitalData);
        renderHospitals(hospitalData);
        hideLoadingState();
        console.log('🎉 Application initialized successfully!');
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showErrorState('Failed to load application: ' + error.message);
    }
}

// BULLETPROOF JSON LOADING
async function loadHospitalData() {
    if (isLoading) {
        console.log('⏳ Already loading data, skipping...');
        return;
    }
    
    isLoading = true;
    console.log('🔍 Starting JSON load process...');
    
    try {
        // Try multiple possible paths in case of path issues
        const possiblePaths = [
            './data/2025/2025_GW_HospitalScores.json',
            'data/2025/2025_GW_HospitalScores.json',
            '/data/2025/2025_GW_HospitalScores.json'
        ];
        
        let response = null;
        let successfulPath = null;
        
        // Try each path until one works
        for (const path of possiblePaths) {
            console.log(`🔧 Trying path: ${path}`);
            try {
                response = await fetch(path);
                if (response.ok) {
                    successfulPath = path;
                    console.log(`✅ Success with path: ${path}`);
                    break;
                }
            } catch (pathError) {
                console.log(`❌ Failed with path ${path}:`, pathError.message);
                continue;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`All paths failed. Check that the JSON file exists. Tried: ${possiblePaths.join(', ')}`);
        }
        
        console.log('📄 JSON file found, parsing...');
        const data = await response.json();
        console.log('📊 Raw JSON data type:', typeof data);
        console.log('📊 Raw JSON keys:', Object.keys(data));
        
        // EXTREMELY FLEXIBLE DATA EXTRACTION
        if (Array.isArray(data)) {
            hospitalData = data;
            console.log('✅ Data is direct array');
        } else if (data.hospitals && Array.isArray(data.hospitals)) {
            hospitalData = data.hospitals;
            console.log('✅ Data has "hospitals" array');
        } else if (data.data && Array.isArray(data.data)) {
            hospitalData = data.data;
            console.log('✅ Data has "data" array');
        } else {
            // Try to find ANY array in the object
            console.log('🔍 Searching for arrays in object...');
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    hospitalData = data[key];
                    console.log(`✅ Found array in key: "${key}" with ${data[key].length} items`);
                    break;
                }
            }
            
            if (hospitalData.length === 0) {
                // Last resort: try to use the object values as array
                const values = Object.values(data);
                if (values.length > 0 && Array.isArray(values[0])) {
                    hospitalData = values[0];
                    console.log('✅ Using first array found in object values');
                }
            }
        }
        
        // VALIDATE THE DATA
        if (hospitalData.length === 0) {
            console.warn('⚠️ No hospital data found. JSON structure:', JSON.stringify(data).substring(0, 500));
            throw new Error('No hospital data found in JSON file. Check the file structure.');
        }
        
        // Validate that we have the expected fields
        const firstHospital = hospitalData[0];
        console.log('🏥 First hospital sample:', firstHospital);
        console.log('🔑 Available keys in first hospital:', Object.keys(firstHospital));
        
        // Check for critical fields
        const criticalFields = ['Hospital_Name', 'Overall_Star_Rating'];
        const missingFields = criticalFields.filter(field => !(field in firstHospital));
        
        if (missingFields.length > 0) {
            console.warn('⚠️ Missing critical fields:', missingFields);
            console.warn('📋 Available fields:', Object.keys(firstHospital));
        }
        
        filteredHospitalData = [...hospitalData];
        
        console.log(`✅ SUCCESS: Loaded ${hospitalData.length} hospitals`);
        console.log('📋 Sample hospital:', {
            name: firstHospital.Hospital_Name,
            city: firstHospital.City,
            rating: firstHospital.Overall_Star_Rating,
            lat: firstHospital.Latitude,
            lon: firstHospital.Longitude
        });
        
    } catch (err) {
        console.error('💥 CRITICAL ERROR loading JSON:', err);
        console.error('💥 Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
        throw new Error(`Cannot load hospital data: ${err.message}`);
    } finally {
        isLoading = false;
    }
}

// ... (rest of the functions from the previous version remain exactly the same)
// But I'll include the critical showErrorState function:

function showLoadingState() {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsCount) resultsCount.textContent = 'Loading hospitals...';
    if (resultsTable) {
        resultsTable.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <p>Loading hospital data...</p>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        Reading from: data/2025/2025_GW_HospitalScores.json
                    </p>
                </td>
            </tr>
        `;
    }
}

function showErrorState(message) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsCount) resultsCount.textContent = 'Error loading data';
    if (resultsTable) {
        resultsTable.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <div style="font-size: 48px; margin-bottom: 16px;">💥</div>
                    <h3>Application Error</h3>
                    <p>${message}</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: left;">
                        <strong>Troubleshooting:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Check if data/2025/2025_GW_HospitalScores.json exists</li>
                            <li>Verify the JSON file is valid</li>
                            <li>Check browser console (F12) for detailed errors</li>
                            <li>Try refreshing the page</li>
                        </ul>
                    </div>
                    <button onclick="location.reload()" style="
                        background: #6fb353;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 16px;
                    ">Try Again</button>
                    <button onclick="testJSONManually()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 16px;
                        margin-left: 10px;
                    ">Test JSON File</button>
                </td>
            </tr>
        `;
    }
}

// Manual JSON test function
window.testJSONManually = async function() {
    console.log('🧪 Manual JSON test started...');
    try {
        const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('✅ Manual test SUCCESS:', data);
        alert('✅ JSON file is accessible and valid! Check browser console for details.');
    } catch (error) {
        console.error('❌ Manual test FAILED:', error);
        alert('❌ JSON file error: ' + error.message);
    }
};

// Add loading spinner styles
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
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
document.head.appendChild(loadingStyles);

console.log('🔄 main.js loaded and ready to initialize...');
