#!/usr/bin/env node

const puppeteer = require('puppeteer');

const BASE_URL = 'https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so';

async function testModule(browser, moduleName, modulePath, tests) {
    const page = await browser.newPage();
    console.log(`\n📊 Testing ${moduleName} at ${modulePath}`);
    
    try {
        // Navigate to module
        const url = `${BASE_URL}${modulePath}`;
        console.log(`   Navigating to: ${url}`);
        
        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        if (!response || !response.ok()) {
            console.log(`   ❌ Module returned status: ${response ? response.status() : 'no response'}`);
            return false;
        }
        
        console.log(`   ✅ Module loaded successfully (status: ${response.status()})`);
        
        // Run module-specific tests
        for (const test of tests) {
            try {
                await test(page);
            } catch (error) {
                console.log(`   ❌ Test failed: ${error.message}`);
            }
        }
        
        await page.close();
        return true;
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        await page.close();
        return false;
    }
}

async function testDigitalSourcing(page) {
    console.log(`   Testing form functionality...`);
    
    // Check if application form exists
    const formExists = await page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        return forms.length > 0;
    });
    
    if (formExists) {
        console.log(`   ✅ Application form found`);
        
        // Test form submission
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
            console.log(`   ✅ Submit button found`);
        }
    }
    
    // Check dashboard link
    const dashboardLink = await page.$('a[href*="dashboard"]');
    if (dashboardLink) {
        console.log(`   ✅ Dashboard link exists`);
    }
}

async function testCRM(page) {
    console.log(`   Testing CRM components...`);
    
    // Check for Owner CRM section
    const ownerCRM = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Owner CRM') || text.includes('Hospital Owners');
    });
    
    if (ownerCRM) {
        console.log(`   ✅ Owner CRM section found`);
    }
    
    // Check for Patient CRM section
    const patientCRM = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Patient CRM') || text.includes('Patient Management');
    });
    
    if (patientCRM) {
        console.log(`   ✅ Patient CRM section found`);
    }
}

async function testHMS(page) {
    console.log(`   Testing HMS modules...`);
    
    // Check for key HMS components
    const components = [
        'Electronic Medical Records',
        'Billing',
        'Inventory',
        'Staff Management'
    ];
    
    for (const component of components) {
        const found = await page.evaluate((comp) => {
            return document.body.innerText.includes(comp);
        }, component);
        
        if (found) {
            console.log(`   ✅ ${component} module found`);
        }
    }
}

async function testCommandCentre(page) {
    console.log(`   Testing Command Centre...`);
    
    // Check for dashboard
    const dashboardExists = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('hospitals') || text.includes('Network Overview');
    });
    
    if (dashboardExists) {
        console.log(`   ✅ Operations dashboard found`);
    }
    
    // Check for alerts
    const alertsExist = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Alert') || text.includes('alert');
    });
    
    if (alertsExist) {
        console.log(`   ✅ Alert system found`);
    }
}

async function main() {
    console.log('🏥 GrandPro HMSO - Module Functionality Test');
    console.log('============================================');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    
    try {
        // Test main platform
        console.log('\n📊 Testing Main Platform');
        const mainPage = await browser.newPage();
        const mainResponse = await mainPage.goto(BASE_URL, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        if (mainResponse && mainResponse.ok()) {
            console.log(`   ✅ Main platform loaded (status: ${mainResponse.status()})`);
            
            // Check for module links
            const moduleLinks = await mainPage.evaluate(() => {
                const links = document.querySelectorAll('[onclick*="openModule"]');
                return links.length;
            });
            
            console.log(`   ✅ Found ${moduleLinks} module links on main page`);
        }
        await mainPage.close();
        
        // Test each module
        const modules = [
            {
                name: 'Digital Sourcing',
                path: '/digital-sourcing',
                tests: [testDigitalSourcing]
            },
            {
                name: 'CRM System',
                path: '/crm',
                tests: [testCRM]
            },
            {
                name: 'Hospital Management',
                path: '/hms',
                tests: [testHMS]
            },
            {
                name: 'Command Centre',
                path: '/command-centre',
                tests: [testCommandCentre]
            }
        ];
        
        let successCount = 0;
        for (const module of modules) {
            const success = await testModule(browser, module.name, module.path, module.tests);
            if (success) successCount++;
        }
        
        console.log('\n📊 Test Summary');
        console.log('==============');
        console.log(`✅ Modules accessible: ${successCount}/${modules.length}`);
        
        // Test some API endpoints
        console.log('\n📊 Testing API Endpoints');
        const apiPage = await browser.newPage();
        
        // Test health endpoint
        const healthResponse = await apiPage.goto(`${BASE_URL}/api/health`, {
            waitUntil: 'networkidle2'
        });
        
        if (healthResponse && healthResponse.ok()) {
            const healthData = await apiPage.evaluate(() => {
                return JSON.parse(document.body.innerText);
            });
            console.log(`   ✅ Health API: ${healthData.status}`);
        }
        
        await apiPage.close();
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
