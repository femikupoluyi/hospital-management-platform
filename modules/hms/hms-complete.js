// HMS Complete Frontend JavaScript
const API_BASE = window.location.origin;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentAdmissions();
    loadStaffOnDuty();
    loadInventoryAlerts();
    
    // Set up form handlers
    setupFormHandlers();
    
    // Refresh data every 30 seconds
    setInterval(() => {
        loadDashboardStats();
        loadStaffOnDuty();
    }, 30000);
});

// Setup all form handlers
function setupFormHandlers() {
    const forms = {
        'newPatientForm': handleNewPatient,
        'invoiceForm': handleCreateInvoice,
        'stockEntryForm': handleStockEntry,
        'scheduleForm': handleAddSchedule,
        'admissionForm': handleAdmission,
        'reportForm': handleGenerateReport
    };
    
    Object.keys(forms).forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', forms[formId]);
        }
    });
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/api/analytics/metrics`);
        if (response.ok) {
            const metrics = await response.json();
            
            document.getElementById('totalPatients').textContent = metrics.totalPatients || 0;
            document.getElementById('todayAppointments').textContent = metrics.todayAppointments || 0;
            document.getElementById('availableBeds').textContent = metrics.availableBeds || 0;
            document.getElementById('staffOnDuty').textContent = metrics.staffOnDuty || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent admissions
async function loadRecentAdmissions() {
    try {
        const response = await fetch(`${API_BASE}/api/beds/admissions?limit=10`);
        const tbody = document.getElementById('admissionsTable');
        
        if (response.ok) {
            const admissions = await response.json();
            
            if (admissions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No recent admissions</td></tr>';
                return;
            }
            
            tbody.innerHTML = admissions.map(admission => `
                <tr>
                    <td>${admission.patient_id || 'N/A'}</td>
                    <td>${admission.patient_name}</td>
                    <td>${admission.ward_name || 'Ward ' + admission.ward_id}</td>
                    <td>${admission.bed_number || 'Bed ' + admission.bed_id}</td>
                    <td>${new Date(admission.admission_date).toLocaleDateString()}</td>
                    <td>${admission.doctor_id || 'Not assigned'}</td>
                    <td><span class="badge badge-active">${admission.status}</span></td>
                    <td>
                        ${admission.status === 'Active' ? 
                            `<button class="btn btn-danger" onclick="processDischarge('${admission.admission_id}')">Discharge</button>` :
                            '-'
                        }
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Failed to load admissions</td></tr>';
        }
    } catch (error) {
        console.error('Error loading admissions:', error);
        document.getElementById('admissionsTable').innerHTML = 
            '<tr><td colspan="8" style="text-align: center;">Error loading data</td></tr>';
    }
}

// Load staff on duty
async function loadStaffOnDuty() {
    try {
        const response = await fetch(`${API_BASE}/api/staff/on-duty`);
        const tbody = document.getElementById('staffTable');
        
        if (response.ok) {
            const staff = await response.json();
            
            if (staff.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No staff on duty</td></tr>';
                return;
            }
            
            tbody.innerHTML = staff.map(member => {
                const checkedIn = member.check_in ? new Date(member.check_in).toLocaleTimeString() : 'Not checked in';
                const status = member.check_in ? 'Active' : 'Scheduled';
                
                return `
                    <tr>
                        <td>${member.staff_id}</td>
                        <td>${member.name}</td>
                        <td>${member.department}</td>
                        <td>${member.position}</td>
                        <td>${member.shift_type}</td>
                        <td>${checkedIn}</td>
                        <td><span class="badge badge-${status === 'Active' ? 'active' : 'pending'}">${status}</span></td>
                        <td>
                            ${!member.check_in ? 
                                `<button class="btn btn-success" onclick="checkIn('${member.staff_id}')">Check In</button>` :
                                !member.check_out ?
                                `<button class="btn btn-danger" onclick="checkOut('${member.staff_id}')">Check Out</button>` :
                                '-'
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Failed to load staff data</td></tr>';
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        document.getElementById('staffTable').innerHTML = 
            '<tr><td colspan="8" style="text-align: center;">Error loading data</td></tr>';
    }
}

// Load inventory alerts
async function loadInventoryAlerts() {
    try {
        const response = await fetch(`${API_BASE}/api/inventory/low-stock`);
        const alertSection = document.getElementById('alertMessage');
        
        if (response.ok) {
            const lowStockItems = await response.json();
            
            if (lowStockItems.length === 0) {
                alertSection.textContent = 'All items are well stocked!';
                document.getElementById('alertSection').style.background = '#c6f6d5';
                document.getElementById('alertSection').style.borderColor = '#48bb78';
            } else {
                const itemNames = lowStockItems.slice(0, 3).map(item => item.name).join(', ');
                const moreCount = lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : '';
                alertSection.textContent = `Low stock: ${itemNames}${moreCount}`;
            }
        }
    } catch (error) {
        console.error('Error loading inventory alerts:', error);
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Modal open functions with event stopping
function openNewPatientModal(e) {
    if (e) e.stopPropagation();
    openModal('newPatientModal');
}

function openPatientsListModal(e) {
    if (e) e.stopPropagation();
    loadPatientsList();
    openModal('patientsListModal');
}

function openInvoiceModal(e) {
    if (e) e.stopPropagation();
    openModal('invoiceModal');
}

function openInvoicesListModal(e) {
    if (e) e.stopPropagation();
    loadInvoices('all');
    openModal('invoicesListModal');
}

function openStockEntryModal(e) {
    if (e) e.stopPropagation();
    loadInventoryItems();
    openModal('stockEntryModal');
}

function openLowStockModal(e) {
    if (e) e.stopPropagation();
    showLowStockItems();
    openModal('lowStockModal');
}

function openScheduleModal(e) {
    if (e) e.stopPropagation();
    loadStaffList();
    openModal('scheduleModal');
}

function openRosterModal(e) {
    if (e) e.stopPropagation();
    loadRoster();
    openModal('rosterModal');
}

function openAdmissionModal(e) {
    if (e) e.stopPropagation();
    loadWards();
    openModal('admissionModal');
}

function openBedsModal(e) {
    if (e) e.stopPropagation();
    showAvailableBeds();
    openModal('bedsModal');
}

function openAnalyticsModal(e) {
    if (e) e.stopPropagation();
    loadAnalytics();
    openModal('analyticsModal');
}

function openReportModal(e) {
    if (e) e.stopPropagation();
    openModal('reportModal');
}

// Load patients list
async function loadPatientsList() {
    try {
        const container = document.getElementById('patientsList');
        container.innerHTML = '<div class="loading"></div>';
        
        const response = await fetch(`${API_BASE}/api/emr/records`);
        if (response.ok) {
            const data = await response.json();
            const patients = data.records || data;
            
            if (patients.length === 0) {
                container.innerHTML = '<div class="empty-state">No patients found</div>';
                return;
            }
            
            container.innerHTML = patients.map(patient => `
                <div class="list-item" onclick="viewPatientDetails('${patient.patient_id}', '${patient.patient_name}')">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>${patient.patient_name}</strong> (${patient.patient_id})
                            <br>
                            <small>Age: ${patient.patient_age} | Gender: ${patient.patient_gender}</small>
                            <br>
                            <small>Phone: ${patient.contact_phone || 'N/A'} | Visits: ${patient.total_visits}</small>
                        </div>
                        <div style="text-align: right;">
                            <small>Last Visit: ${patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">Failed to load patients</div>';
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        document.getElementById('patientsList').innerHTML = '<div class="empty-state">Error loading patients</div>';
    }
}

// View patient details
async function viewPatientDetails(patientId, patientName) {
    closeModal('patientsListModal');
    document.getElementById('patientDetailsName').textContent = patientName;
    openModal('patientDetailsModal');
    
    const content = document.getElementById('patientDetailsContent');
    content.innerHTML = '<div class="loading"></div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/emr/records/${patientId}`);
        if (response.ok) {
            const data = await response.json();
            
            // Display basic info by default
            displayPatientBasicInfo(data.patient);
            
            // Store data for tab switching
            window.currentPatientData = data;
        } else {
            content.innerHTML = '<div class="empty-state">Failed to load patient details</div>';
        }
    } catch (error) {
        console.error('Error loading patient details:', error);
        content.innerHTML = '<div class="empty-state">Error loading patient details</div>';
    }
}

// Display patient basic info
function displayPatientBasicInfo(patient) {
    const content = document.getElementById('patientDetailsContent');
    content.innerHTML = `
        <div style="padding: 20px;">
            <h3>Basic Information</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Patient ID</label>
                    <p>${patient.patient_id}</p>
                </div>
                <div class="form-group">
                    <label>Name</label>
                    <p>${patient.patient_name}</p>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Age</label>
                    <p>${patient.patient_age} years</p>
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <p>${patient.patient_gender}</p>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <p>${patient.contact_phone || 'Not provided'}</p>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <p>${patient.contact_email || 'Not provided'}</p>
                </div>
            </div>
        </div>
    `;
}

// Switch tabs in patient details
function switchTab(event, tabName) {
    // Update active tab
    document.querySelectorAll('#patientDetailsModal .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const content = document.getElementById('patientDetailsContent');
    const data = window.currentPatientData;
    
    if (!data) {
        content.innerHTML = '<div class="empty-state">No data available</div>';
        return;
    }
    
    switch(tabName) {
        case 'basicInfo':
            displayPatientBasicInfo(data.patient);
            break;
        case 'encounters':
            displayPatientEncounters(data.encounters);
            break;
        case 'diagnoses':
            displayPatientDiagnoses(data.diagnoses);
            break;
        case 'prescriptions':
            displayPatientPrescriptions(data.prescriptions);
            break;
        case 'labResults':
            displayPatientLabResults(data.labResults);
            break;
    }
}

// Display patient encounters
function displayPatientEncounters(encounters) {
    const content = document.getElementById('patientDetailsContent');
    
    if (!encounters || encounters.length === 0) {
        content.innerHTML = '<div class="empty-state">No encounters found</div>';
        return;
    }
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <h3>Medical Encounters</h3>
            ${encounters.map(enc => `
                <div class="list-item">
                    <strong>${enc.encounter_type}</strong> - ${new Date(enc.encounter_date).toLocaleDateString()}
                    <br>
                    <small>Chief Complaint: ${enc.chief_complaint}</small>
                    <br>
                    <small>Status: <span class="badge badge-${enc.status === 'Active' ? 'active' : 'pending'}">${enc.status}</span></small>
                </div>
            `).join('')}
        </div>
    `;
}

// Display patient diagnoses
function displayPatientDiagnoses(diagnoses) {
    const content = document.getElementById('patientDetailsContent');
    
    if (!diagnoses || diagnoses.length === 0) {
        content.innerHTML = '<div class="empty-state">No diagnoses found</div>';
        return;
    }
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <h3>Diagnoses</h3>
            ${diagnoses.map(diag => `
                <div class="list-item">
                    <strong>${diag.diagnosis_code}</strong> - ${diag.diagnosis_desc}
                    <br>
                    <small>Date: ${new Date(diag.diagnosis_date).toLocaleDateString()}</small>
                    <br>
                    <small>Severity: ${diag.severity || 'Not specified'}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// Display patient prescriptions
function displayPatientPrescriptions(prescriptions) {
    const content = document.getElementById('patientDetailsContent');
    
    if (!prescriptions || prescriptions.length === 0) {
        content.innerHTML = '<div class="empty-state">No prescriptions found</div>';
        return;
    }
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <h3>Prescriptions</h3>
            ${prescriptions.map(pres => `
                <div class="list-item">
                    <strong>${pres.medication_name}</strong>
                    <br>
                    <small>Dosage: ${pres.dosage} | Frequency: ${pres.frequency}</small>
                    <br>
                    <small>Duration: ${pres.duration} | Date: ${new Date(pres.prescription_date).toLocaleDateString()}</small>
                    <br>
                    <small>Instructions: ${pres.instructions || 'None'}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// Display patient lab results
function displayPatientLabResults(labResults) {
    const content = document.getElementById('patientDetailsContent');
    
    if (!labResults || labResults.length === 0) {
        content.innerHTML = '<div class="empty-state">No lab results found</div>';
        return;
    }
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <h3>Lab Results</h3>
            ${labResults.map(lab => `
                <div class="list-item">
                    <strong>${lab.test_name}</strong> (${lab.test_type})
                    <br>
                    <small>Result: ${lab.result_value} | Normal: ${lab.normal_range}</small>
                    <br>
                    <small>Interpretation: ${lab.interpretation || 'Pending'}</small>
                    <br>
                    <small>Date: ${new Date(lab.test_date).toLocaleDateString()}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// Search patients
function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const items = document.querySelectorAll('#patientsList .list-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Load invoices
async function loadInvoices(status) {
    try {
        const container = document.getElementById('invoicesList');
        container.innerHTML = '<div class="loading"></div>';
        
        // Update active tab
        document.querySelectorAll('#invoicesListModal .tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.includes(status === 'all' ? 'All' : status)) {
                tab.classList.add('active');
            }
        });
        
        const url = status === 'all' ? 
            `${API_BASE}/api/billing/invoices` : 
            `${API_BASE}/api/billing/invoices?status=${status}`;
            
        const response = await fetch(url);
        if (response.ok) {
            const invoices = await response.json();
            
            if (invoices.length === 0) {
                container.innerHTML = '<div class="empty-state">No invoices found</div>';
                return;
            }
            
            container.innerHTML = invoices.map(invoice => `
                <div class="list-item" onclick="viewInvoiceDetails('${invoice.invoice_id}')">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>${invoice.invoice_number}</strong>
                            <br>
                            <small>Patient: ${invoice.patient_name} (${invoice.patient_id})</small>
                            <br>
                            <small>Date: ${new Date(invoice.invoice_date).toLocaleDateString()}</small>
                        </div>
                        <div style="text-align: right;">
                            <strong>$${parseFloat(invoice.total_amount).toFixed(2)}</strong>
                            <br>
                            <small>Paid: $${parseFloat(invoice.paid_amount || 0).toFixed(2)}</small>
                            <br>
                            <span class="badge badge-${invoice.payment_status === 'Paid' ? 'active' : 'pending'}">
                                ${invoice.payment_status}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">Failed to load invoices</div>';
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
        document.getElementById('invoicesList').innerHTML = '<div class="empty-state">Error loading invoices</div>';
    }
}

// Toggle insurance fields
function toggleInsuranceFields(select) {
    const showInsurance = ['Insurance', 'NHIS', 'HMO'].includes(select.value);
    document.getElementById('insuranceProviderGroup').style.display = showInsurance ? 'block' : 'none';
    document.getElementById('insuranceNumberGroup').style.display = showInsurance ? 'block' : 'none';
}

// Add invoice item
function addInvoiceItem() {
    const itemsContainer = document.getElementById('invoiceItems');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Service Description</label>
                <input type="text" name="description[]" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" name="quantity[]" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label>Unit Price</label>
                <input type="number" name="unit_price[]" min="0" step="0.01" required>
            </div>
        </div>
    `;
    itemsContainer.appendChild(newItem);
}

// Load inventory items
async function loadInventoryItems() {
    try {
        const response = await fetch(`${API_BASE}/api/inventory/items`);
        if (response.ok) {
            const items = await response.json();
            
            const select = document.querySelector('#stockEntryModal select[name="item_id"]');
            select.innerHTML = '<option value="">Select Item</option>' +
                items.map(item => 
                    `<option value="${item.item_id}">${item.name} (Current: ${item.current_quantity})</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading inventory items:', error);
    }
}

// Show low stock items
async function showLowStockItems() {
    try {
        const container = document.getElementById('lowStockList');
        container.innerHTML = '<div class="loading"></div>';
        
        const response = await fetch(`${API_BASE}/api/inventory/low-stock`);
        if (response.ok) {
            const items = await response.json();
            
            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state">No low stock items!</div>';
                return;
            }
            
            container.innerHTML = `
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                            <th>Reorder Level</th>
                            <th>Unit</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
                            const percentage = (item.current_quantity / item.reorder_level * 100).toFixed(0);
                            const status = percentage < 50 ? 'Critical' : 'Low';
                            return `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.category || 'Uncategorized'}</td>
                                    <td>${item.current_quantity}</td>
                                    <td>${item.reorder_level}</td>
                                    <td>${item.unit || 'units'}</td>
                                    <td>
                                        <span class="badge badge-${status === 'Critical' ? 'pending' : 'active'}">
                                            ${status} (${percentage}%)
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<div class="empty-state">Failed to load low stock items</div>';
        }
    } catch (error) {
        console.error('Error loading low stock items:', error);
        document.getElementById('lowStockList').innerHTML = '<div class="empty-state">Error loading items</div>';
    }
}

// Load staff list
async function loadStaffList() {
    try {
        const response = await fetch(`${API_BASE}/api/staff/all`);
        if (response.ok) {
            const staff = await response.json();
            
            const select = document.querySelector('#scheduleModal select[name="staff_id"]');
            select.innerHTML = '<option value="">Select Staff</option>' +
                staff.map(s => 
                    `<option value="${s.staff_id}">${s.name} - ${s.position}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading staff list:', error);
    }
}

// Load roster
async function loadRoster() {
    try {
        const container = document.getElementById('rosterList');
        container.innerHTML = '<div class="loading"></div>';
        
        const date = document.getElementById('rosterDate').value;
        const department = document.getElementById('rosterDepartment').value;
        
        let url = `${API_BASE}/api/staff/roster?date=${date}`;
        if (department) {
            url += `&department=${department}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
            const roster = await response.json();
            
            if (roster.length === 0) {
                container.innerHTML = '<div class="empty-state">No schedules for selected date</div>';
                return;
            }
            
            container.innerHTML = `
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Position</th>
                            <th>Department</th>
                            <th>Shift Type</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${roster.map(schedule => `
                            <tr>
                                <td>${schedule.staff_name}</td>
                                <td>${schedule.position}</td>
                                <td>${schedule.department}</td>
                                <td>${schedule.shift_type}</td>
                                <td>${schedule.start_time}</td>
                                <td>${schedule.end_time}</td>
                                <td>
                                    <span class="badge badge-${schedule.status === 'Scheduled' ? 'active' : 'pending'}">
                                        ${schedule.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<div class="empty-state">Failed to load roster</div>';
        }
    } catch (error) {
        console.error('Error loading roster:', error);
        document.getElementById('rosterList').innerHTML = '<div class="empty-state">Error loading roster</div>';
    }
}

// Load wards
async function loadWards() {
    try {
        // For now, use static ward data
        const wards = [
            { ward_id: 1, name: 'General Ward A' },
            { ward_id: 2, name: 'ICU' },
            { ward_id: 3, name: 'Maternity Ward' },
            { ward_id: 4, name: 'Pediatric Ward' },
            { ward_id: 5, name: 'Emergency Ward' }
        ];
        
        const select = document.querySelector('#admissionModal select[name="ward_id"]');
        select.innerHTML = '<option value="">Select Ward</option>' +
            wards.map(w => `<option value="${w.ward_id}">${w.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading wards:', error);
    }
}

// Load available beds for a ward
async function loadAvailableBeds(wardId) {
    if (!wardId) {
        document.querySelector('#admissionModal select[name="bed_id"]').innerHTML = 
            '<option value="">Select Ward First</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/beds/available?ward_id=${wardId}`);
        if (response.ok) {
            const beds = await response.json();
            
            const select = document.querySelector('#admissionModal select[name="bed_id"]');
            
            if (beds.length === 0) {
                select.innerHTML = '<option value="">No beds available</option>';
            } else {
                select.innerHTML = '<option value="">Select Bed</option>' +
                    beds.map(bed => 
                        `<option value="${bed.bed_id}">${bed.bed_number}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading beds:', error);
    }
}

// Show available beds
async function showAvailableBeds() {
    try {
        const container = document.getElementById('bedsList');
        container.innerHTML = '<div class="loading"></div>';
        
        const response = await fetch(`${API_BASE}/api/beds/occupancy`);
        if (response.ok) {
            const wards = await response.json();
            
            container.innerHTML = `
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Ward</th>
                            <th>Total Beds</th>
                            <th>Available</th>
                            <th>Occupied</th>
                            <th>Occupancy Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${wards.map(ward => `
                            <tr>
                                <td>${ward.ward_name}</td>
                                <td>${ward.total_beds}</td>
                                <td>${ward.available_beds}</td>
                                <td>${ward.occupied_beds}</td>
                                <td>
                                    <strong>${ward.occupancy_rate}%</strong>
                                    <div style="width: 100px; height: 10px; background: #e2e8f0; border-radius: 5px; margin-top: 5px;">
                                        <div style="width: ${ward.occupancy_rate}%; height: 100%; background: ${ward.occupancy_rate > 80 ? '#f56565' : '#48bb78'}; border-radius: 5px;"></div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<div class="empty-state">Failed to load bed availability</div>';
        }
    } catch (error) {
        console.error('Error loading bed availability:', error);
        document.getElementById('bedsList').innerHTML = '<div class="empty-state">Error loading data</div>';
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/api/analytics/metrics`);
        if (response.ok) {
            const metrics = await response.json();
            
            document.getElementById('todayRevenue').textContent = `$${metrics.todayRevenue.toFixed(2)}`;
            document.getElementById('occupancyRate').textContent = `${metrics.occupancyRate}%`;
            document.getElementById('pendingInvoices').textContent = metrics.pendingInvoices;
            document.getElementById('lowStockCount').textContent = metrics.lowStockItems;
        }
        
        // Load trends
        const trendsResponse = await fetch(`${API_BASE}/api/analytics/trends?period=7d`);
        if (trendsResponse.ok) {
            const trends = await trendsResponse.json();
            // Here you would normally render charts with Chart.js or similar
            // For now, just show placeholders with data counts
            document.getElementById('visitsChart').innerHTML = 
                `<div>Total visits in last 7 days: ${trends.visits.reduce((sum, v) => sum + v.visits, 0)}</div>`;
            document.getElementById('revenueChart').innerHTML = 
                `<div>Total revenue in last 7 days: $${trends.revenue.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0).toFixed(2)}</div>`;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Form handlers
async function handleNewPatient(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE}/api/emr/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(result.message || 'Patient registered successfully!', 'success');
            e.target.reset();
            closeModal('newPatientModal');
            loadDashboardStats();
        } else {
            showToast('Failed to register patient', 'error');
        }
    } catch (error) {
        console.error('Error registering patient:', error);
        showToast('Error registering patient', 'error');
    }
}

async function handleCreateInvoice(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Collect invoice items
    const items = [];
    const descriptions = formData.getAll('description[]');
    const quantities = formData.getAll('quantity[]');
    const unitPrices = formData.getAll('unit_price[]');
    
    for (let i = 0; i < descriptions.length; i++) {
        items.push({
            description: descriptions[i],
            service_code: `SRV-${Date.now()}-${i}`,
            quantity: parseInt(quantities[i]),
            unit_price: parseFloat(unitPrices[i])
        });
    }
    
    const data = {
        patient_id: formData.get('patient_id'),
        patient_name: formData.get('patient_name'),
        payment_method: formData.get('payment_method'),
        insurance_provider: formData.get('insurance_provider'),
        insurance_number: formData.get('insurance_number'),
        items: items
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/billing/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(result.message || 'Invoice created successfully!', 'success');
            e.target.reset();
            closeModal('invoiceModal');
        } else {
            showToast('Failed to create invoice', 'error');
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        showToast('Error creating invoice', 'error');
    }
}

async function handleStockEntry(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE}/api/inventory/stock-entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(result.message || 'Stock entry recorded!', 'success');
            e.target.reset();
            closeModal('stockEntryModal');
            loadInventoryAlerts();
        } else {
            showToast('Failed to record stock entry', 'error');
        }
    } catch (error) {
        console.error('Error recording stock entry:', error);
        showToast('Error recording stock entry', 'error');
    }
}

async function handleAddSchedule(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE}/api/staff/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(result.message || 'Schedule added successfully!', 'success');
            e.target.reset();
            closeModal('scheduleModal');
            loadStaffOnDuty();
        } else {
            showToast('Failed to add schedule', 'error');
        }
    } catch (error) {
        console.error('Error adding schedule:', error);
        showToast('Error adding schedule', 'error');
    }
}

async function handleAdmission(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE}/api/beds/admission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(result.message || 'Patient admitted successfully!', 'success');
            e.target.reset();
            closeModal('admissionModal');
            loadRecentAdmissions();
            loadDashboardStats();
        } else {
            showToast('Failed to process admission', 'error');
        }
    } catch (error) {
        console.error('Error processing admission:', error);
        showToast('Error processing admission', 'error');
    }
}

async function handleGenerateReport(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(
            `${API_BASE}/api/reports/generate?type=${data.type}&format=${data.format}&startDate=${data.startDate}&endDate=${data.endDate}`
        );
        
        if (response.ok) {
            if (data.format === 'json') {
                const report = await response.json();
                console.log('Report data:', report);
                showToast('Report generated! Check console for data.', 'success');
            } else {
                // For PDF/CSV, trigger download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${data.type}-${Date.now()}.${data.format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                showToast('Report downloaded!', 'success');
            }
            closeModal('reportModal');
        } else {
            showToast('Failed to generate report', 'error');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error generating report', 'error');
    }
}

// Staff attendance functions
async function checkIn(staffId) {
    try {
        const response = await fetch(`${API_BASE}/api/staff/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: staffId, action: 'IN' })
        });
        
        if (response.ok) {
            showToast('Check-in recorded successfully!', 'success');
            loadStaffOnDuty();
        } else {
            showToast('Failed to record check-in', 'error');
        }
    } catch (error) {
        console.error('Error recording check-in:', error);
        showToast('Error recording check-in', 'error');
    }
}

async function checkOut(staffId) {
    try {
        const response = await fetch(`${API_BASE}/api/staff/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: staffId, action: 'OUT' })
        });
        
        if (response.ok) {
            showToast('Check-out recorded successfully!', 'success');
            loadStaffOnDuty();
        } else {
            showToast('Failed to record check-out', 'error');
        }
    } catch (error) {
        console.error('Error recording check-out:', error);
        showToast('Error recording check-out', 'error');
    }
}

// Process discharge
async function processDischarge(admissionId) {
    if (!confirm('Are you sure you want to discharge this patient?')) return;
    
    const notes = prompt('Enter discharge notes:');
    if (!notes) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/beds/discharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admission_id: admissionId, discharge_notes: notes })
        });
        
        if (response.ok) {
            showToast('Patient discharged successfully!', 'success');
            loadRecentAdmissions();
            loadDashboardStats();
        } else {
            showToast('Failed to process discharge', 'error');
        }
    } catch (error) {
        console.error('Error processing discharge:', error);
        showToast('Error processing discharge', 'error');
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export functions for global use
window.openNewPatientModal = openNewPatientModal;
window.openPatientsListModal = openPatientsListModal;
window.openInvoiceModal = openInvoiceModal;
window.openInvoicesListModal = openInvoicesListModal;
window.openStockEntryModal = openStockEntryModal;
window.openLowStockModal = openLowStockModal;
window.openScheduleModal = openScheduleModal;
window.openRosterModal = openRosterModal;
window.openAdmissionModal = openAdmissionModal;
window.openBedsModal = openBedsModal;
window.openAnalyticsModal = openAnalyticsModal;
window.openReportModal = openReportModal;
window.closeModal = closeModal;
window.checkIn = checkIn;
window.checkOut = checkOut;
window.processDischarge = processDischarge;
window.searchPatients = searchPatients;
window.viewPatientDetails = viewPatientDetails;
window.switchTab = switchTab;
window.loadInvoices = loadInvoices;
window.toggleInsuranceFields = toggleInsuranceFields;
window.addInvoiceItem = addInvoiceItem;
window.loadAvailableBeds = loadAvailableBeds;
window.loadRoster = loadRoster;
window.showToast = showToast;
