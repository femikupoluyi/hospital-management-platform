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
    <title>CRM & Relationship Management</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <header class="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4">
        <div class="container mx-auto px-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-users text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold">CRM System</h1>
                        <p class="text-sm opacity-90">Patient & Owner Relationship Management</p>
                    </div>
                </div>
                <a href="/" class="bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-100">
                    Back to Platform
                </a>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-6 py-8">
        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="flex border-b">
                <button class="px-6 py-3 font-semibold text-purple-600 border-b-2 border-purple-600" onclick="showTab('patients')">
                    Patient CRM
                </button>
                <button class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600" onclick="showTab('owners')">
                    Owner CRM
                </button>
                <button class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600" onclick="showTab('campaigns')">
                    Campaigns
                </button>
            </div>
        </div>

        <!-- Patient CRM Tab -->
        <div id="patientsTab" class="tab-content">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Appointment Scheduling -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Schedule Appointment</h3>
                    <form class="space-y-3">
                        <input type="text" class="w-full p-2 border rounded" placeholder="Patient Name">
                        <input type="date" class="w-full p-2 border rounded">
                        <input type="time" class="w-full p-2 border rounded">
                        <select class="w-full p-2 border rounded">
                            <option>General Consultation</option>
                            <option>Follow-up</option>
                            <option>Emergency</option>
                        </select>
                        <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                            Book Appointment
                        </button>
                    </form>
                </div>

                <!-- Patient List -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Recent Patients</h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 border rounded">
                            <div>
                                <p class="font-semibold">John Doe</p>
                                <p class="text-sm text-gray-600">Last visit: 2 days ago</p>
                            </div>
                            <button class="text-purple-600 hover:text-purple-800">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        <div class="flex items-center justify-between p-3 border rounded">
                            <div>
                                <p class="font-semibold">Jane Smith</p>
                                <p class="text-sm text-gray-600">Last visit: 1 week ago</p>
                            </div>
                            <button class="text-purple-600 hover:text-purple-800">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loyalty Program -->
            <div class="bg-white rounded-lg shadow p-6 mt-6">
                <h3 class="text-lg font-semibold mb-4">Loyalty Program</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div class="text-center p-4 border rounded">
                        <i class="fas fa-star text-yellow-500 text-2xl mb-2"></i>
                        <p class="font-semibold">Gold Members</p>
                        <p class="text-2xl">45</p>
                    </div>
                    <div class="text-center p-4 border rounded">
                        <i class="fas fa-star text-gray-400 text-2xl mb-2"></i>
                        <p class="font-semibold">Silver Members</p>
                        <p class="text-2xl">128</p>
                    </div>
                    <div class="text-center p-4 border rounded">
                        <i class="fas fa-star text-orange-600 text-2xl mb-2"></i>
                        <p class="font-semibold">Bronze Members</p>
                        <p class="text-2xl">342</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Owner CRM Tab (hidden by default) -->
        <div id="ownersTab" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Hospital Owners</h3>
                <table class="w-full">
                    <thead>
                        <tr class="border-b">
                            <th class="text-left py-2">Owner Name</th>
                            <th class="text-left py-2">Hospital</th>
                            <th class="text-left py-2">Contract Status</th>
                            <th class="text-left py-2">Last Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="border-b">
                            <td class="py-2">Dr. Michael Brown</td>
                            <td class="py-2">St. Mary Hospital</td>
                            <td class="py-2"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span></td>
                            <td class="py-2">$25,000</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2">Sarah Johnson</td>
                            <td class="py-2">City Medical Center</td>
                            <td class="py-2"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span></td>
                            <td class="py-2">$18,500</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Campaigns Tab (hidden by default) -->
        <div id="campaignsTab" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Communication Campaigns</h3>
                <button class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-4">
                    <i class="fas fa-plus mr-2"></i>New Campaign
                </button>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="border rounded p-4">
                        <i class="fas fa-sms text-green-600 text-2xl mb-2"></i>
                        <h4 class="font-semibold">SMS Campaign</h4>
                        <p class="text-sm text-gray-600">Health Tips Weekly</p>
                        <p class="text-sm mt-2">Sent to: 450 patients</p>
                        <p class="text-sm">Open rate: 78%</p>
                    </div>
                    <div class="border rounded p-4">
                        <i class="fab fa-whatsapp text-green-500 text-2xl mb-2"></i>
                        <h4 class="font-semibold">WhatsApp Campaign</h4>
                        <p class="text-sm text-gray-600">Appointment Reminders</p>
                        <p class="text-sm mt-2">Sent to: 234 patients</p>
                        <p class="text-sm">Response rate: 92%</p>
                    </div>
                    <div class="border rounded p-4">
                        <i class="fas fa-envelope text-blue-600 text-2xl mb-2"></i>
                        <h4 class="font-semibold">Email Campaign</h4>
                        <p class="text-sm text-gray-600">Monthly Newsletter</p>
                        <p class="text-sm mt-2">Sent to: 1,200 patients</p>
                        <p class="text-sm">Click rate: 23%</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Show selected tab
            document.getElementById(tabName + 'Tab').classList.remove('hidden');
            
            // Update tab buttons
            const buttons = document.querySelectorAll('.flex.border-b button');
            buttons.forEach(button => {
                button.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
                button.classList.add('text-gray-600');
            });
            
            // Highlight active tab
            event.target.classList.remove('text-gray-600');
            event.target.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
        }
    </script>
</body>
</html>
    `);
});

const PORT = 7001;
app.listen(PORT, () => {
    console.log(`CRM Frontend running on port ${PORT}`);
});
