const express = require('express');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Sourcing & Partner Onboarding</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4">
        <div class="container mx-auto px-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-hospital-user text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold">Digital Sourcing Portal</h1>
                        <p class="text-sm opacity-90">Hospital Onboarding & Partner Management</p>
                    </div>
                </div>
                <a href="/" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
                    Back to Platform
                </a>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-6 py-8">
        <!-- Application Form Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">Hospital Partner Application</h2>
            
            <form id="applicationForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                        <input type="text" class="w-full p-2 border rounded" placeholder="Enter hospital name" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                        <input type="text" class="w-full p-2 border rounded" placeholder="Registration number" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                        <input type="text" class="w-full p-2 border rounded" placeholder="Full name" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" class="w-full p-2 border rounded" placeholder="Email address" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" class="w-full p-2 border rounded" placeholder="Phone number" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Bed Capacity</label>
                        <input type="number" class="w-full p-2 border rounded" placeholder="Number of beds" required>
                    </div>
                </div>
                
                <!-- Document Upload -->
                <div class="border-2 border-dashed border-gray-300 rounded p-4">
                    <p class="text-gray-600 mb-2">Upload Required Documents</p>
                    <input type="file" multiple class="w-full">
                    <p class="text-xs text-gray-500 mt-1">License, Registration, Insurance, Tax Documents</p>
                </div>
                
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Submit Application
                </button>
            </form>
        </div>

        <!-- Application Dashboard -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4">Application Dashboard</h2>
            
            <!-- Progress Tracker -->
            <div class="mb-6">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-gray-600">Application Progress</span>
                    <span class="text-sm font-semibold">Step 2 of 4</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: 50%"></div>
                </div>
                <div class="flex justify-between mt-2 text-xs">
                    <span class="text-green-600">✓ Submitted</span>
                    <span class="text-blue-600">• Under Review</span>
                    <span class="text-gray-400">Contract</span>
                    <span class="text-gray-400">Approved</span>
                </div>
            </div>

            <!-- Applications Table -->
            <table class="w-full">
                <thead>
                    <tr class="border-b">
                        <th class="text-left py-2">Application ID</th>
                        <th class="text-left py-2">Hospital Name</th>
                        <th class="text-left py-2">Status</th>
                        <th class="text-left py-2">Score</th>
                        <th class="text-left py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b">
                        <td class="py-2">APP-2025-001</td>
                        <td class="py-2">St. Mary Hospital</td>
                        <td class="py-2">
                            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Under Review</span>
                        </td>
                        <td class="py-2">85/100</td>
                        <td class="py-2">
                            <button class="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                        </td>
                    </tr>
                    <tr class="border-b">
                        <td class="py-2">APP-2025-002</td>
                        <td class="py-2">City General Hospital</td>
                        <td class="py-2">
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Contract Ready</span>
                        </td>
                        <td class="py-2">92/100</td>
                        <td class="py-2">
                            <button class="text-blue-600 hover:text-blue-800 text-sm">Sign Contract</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>

    <script>
        document.getElementById('applicationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Application submitted successfully! Application ID: APP-2025-003');
        });
    </script>
</body>
</html>
    `);
});

const PORT = 8091;
app.listen(PORT, () => {
    console.log(`Digital Sourcing Frontend running on port ${PORT}`);
});
