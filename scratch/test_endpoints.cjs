// Node 22 has built-in fetch, no need for node-fetch

async function testQualificationDelete() {
    console.log('--- Testing Qualification Delete ---');
    // 1. Get all qualifications
    const res = await fetch('http://localhost:5000/api/qualifications');
    const qs = await res.json();
    console.log(`Found ${qs.length} qualifications`);
    
    if (qs.length > 0) {
        const q = qs[0];
        const id = q._id || q.id;
        console.log(`Trying to delete qualification: ${id}`);
        
        const deleteRes = await fetch(`http://localhost:5000/api/qualifications/${id}`, {
            method: 'DELETE'
        });
        
        console.log(`Delete response status: ${deleteRes.status}`);
        
        // 2. Verify deletion
        const verifyRes = await fetch('http://localhost:5000/api/qualifications');
        const qsAfter = await verifyRes.json();
        const exists = qsAfter.some(item => (item._id || item.id) === id);
        console.log(`Qualification exists after delete: ${exists}`);
    } else {
        console.log('No qualifications found to test delete.');
    }
}

async function testDistrictStatusUpdate() {
    console.log('\n--- Testing District Status Update ---');
    // 1. Get all districts
    const res = await fetch('http://localhost:5000/api/districts');
    const districts = await res.json();
    console.log(`Found ${districts.length} districts`);
    
    if (districts.length > 0) {
        const d = districts[0];
        const id = d._id || d.id;
        console.log(`Trying to update district ${id} (${d.name}) to status 'Sold'`);
        
        const updateRes = await fetch(`http://localhost:5000/api/districts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Sold' })
        });
        
        console.log(`Update response status: ${updateRes.status}`);
        const updatedD = await updateRes.json();
        console.log(`Updated status: ${updatedD.status}`);
        
        // 2. Verify update
        const verifyRes = await fetch('http://localhost:5000/api/districts');
        const districtsAfter = await verifyRes.json();
        const verifiedD = districtsAfter.find(item => (item._id || item.id) === id);
        console.log(`Verified status in DB: ${verifiedD?.status}`);
    } else {
        console.log('No districts found to test update.');
    }
}

async function runTests() {
    try {
        await testQualificationDelete();
        await testDistrictStatusUpdate();
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

runTests();
