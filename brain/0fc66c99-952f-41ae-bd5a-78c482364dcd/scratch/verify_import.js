const districts = [
  { id: 'dist1', name: 'Surat' },
  { id: 'dist2', name: 'Mohali' }
];

const importMapping = {
  'Partner Name': 'name',
  'District': 'districtName',
  'Onboarding': 'onboardingDate',
  'Committed': 'committedAmount',
  'Received': 'receivedAmount',
  'Status': 'paymentStatus',
  'Notes': 'notes'
};

const importData = [
  {
    'Partner Name': 'Ayush Beriwal',
    'District': 'Surat',
    'Onboarding': '29/05/25',
    'Committed': '70,000',
    'Received': '70,000',
    'Status': 'Sold',
    'Notes': 'Paid full'
  },
  {
    'Partner Name': 'Devi Dayal Sharma',
    'District': 'Kurukshetra',
    'Onboarding': '(blank)',
    'Committed': '100,000',
    'Received': '25,000',
    'Status': 'Partial',
    'Notes': 'No onboarding date'
  }
];

function testImport() {
  const finalized = importData.map(row => {
    const obj = {};
    let hasData = false;
    Object.entries(importMapping).forEach(([fileCol, dbCol]) => {
      if (dbCol && row[fileCol] !== undefined && row[fileCol] !== null) {
        let val = String(row[fileCol]).trim();
        if (val && val !== '(blank)') {
          if (dbCol.includes('Amount')) {
            val = parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
          }
          if (dbCol === 'onboardingDate') {
            const parts = val.split(/[\/\-.]/);
            if (parts.length === 3) {
              let d = parseInt(parts[0]);
              let m = parseInt(parts[1]) - 1;
              let y = parseInt(parts[2]);
              if (y < 100) y += 2000;
              const date = new Date(y, m, d);
              if (!isNaN(date)) val = date.toISOString();
            }
          }
          obj[dbCol] = val;
          hasData = true;
        }
      }
    });

    if (!hasData) return null;

    if (obj.districtName && !obj.districtId) {
      const match = districts.find(d => 
        d.name.toLowerCase().includes(obj.districtName.toLowerCase()) || 
        obj.districtName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) obj.districtId = match.id || match._id;
    }

    if (!obj.name) obj.name = `Partner ${Math.floor(Math.random() * 10000)}`;

    const committed = parseFloat(obj.committedAmount) || 0;
    const received = parseFloat(obj.receivedAmount) || 0;

    return { 
      ...obj,
      committedAmount: committed,
      receivedAmount: received,
      onboardingDate: obj.onboardingDate || new Date().toISOString(),
      paymentStatus: obj.paymentStatus || ((received >= committed && committed > 0) ? 'Paid Full' : 'Partial')
    };
  }).filter(Boolean);

  console.log('Finalized Data:', JSON.stringify(finalized, null, 2));
}

testImport();
