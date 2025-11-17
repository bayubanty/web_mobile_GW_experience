<!DOCTYPE html>
<html>
<head>
    <title>Test JSON Structure</title>
</head>
<body>
    <h1>Testing JSON Structure</h1>
    <div id="result"></div>
    
    <script>
        async function testJSON() {
            try {
                const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
                const data = await response.json();
                
                document.getElementById('result').innerHTML = `
                    <h2>JSON Structure Test</h2>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                    <h3>Keys in root:</h3>
                    <pre>${Object.keys(data).join(', ')}</pre>
                    ${Array.isArray(data) ? 
                        `<p>Root is an array with ${data.length} items</p>` :
                        `<p>Root is an object</p>`
                    }
                    ${data.hospitals ? 
                        `<p>Has 'hospitals' array with ${data.hospitals.length} items</p>` :
                        '<p>No "hospitals" key found</p>'
                    }
                `;
            } catch (error) {
                document.getElementById('result').innerHTML = `
                    <h2 style="color: red;">Error loading JSON</h2>
                    <p>${error.message}</p>
                `;
            }
        }
        
        testJSON();
    </script>
</body>
</html>
