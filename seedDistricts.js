const districtsData = [
  { "District Name": "Surat", "State": "Gujarat", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Mohali", "State": "Punjab", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Chandigarh", "State": "Chandigarh (UT)", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Rampur", "State": "Uttar Pradesh", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Hyderabad", "State": "Telangana", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Chennai", "State": "Tamil Nadu", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Faridabad", "State": "Haryana", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Bhopal", "State": "Madhya Pradesh", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Chengalpattu", "State": "Tamil Nadu", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Sonipat", "State": "Haryana", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Patna", "State": "Bihar", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Vishakhapatnam", "State": "Andhra Pradesh", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Lucknow", "State": "Uttar Pradesh", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Ghaziabad", "State": "Uttar Pradesh", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Bangalore Urban", "State": "Karnataka", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Coimbatore", "State": "Tamil Nadu", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Gulbarga (Kalaburagi)", "State": "Karnataka", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Bijapur (Vijayapura)", "State": "Karnataka", "Status": "Sold", "Inquiry Count": "1", "Price": "118001" },
  { "District Name": "Ananthpur (Anantapur)", "State": "Andhra Pradesh", "Status": "Sold", "Inquiry Count": "1", "Price": "118002" },
  { "District Name": "Ramnagara (Ramanagara)", "State": "Karnataka", "Status": "Sold", "Inquiry Count": "1", "Price": "100000" },
  { "District Name": "Mangalore", "State": "Karnataka", "Status": "Sold", "Inquiry Count": "1", "Price": "100000" },
  { "District Name": "Kurukshetra", "State": "Haryana", "Status": "Sold", "Inquiry Count": "1", "Price": "118000" },
  { "District Name": "Bellary (Ballari)", "State": "Karnataka", "Status": "Sold", "Inquiry Count": "1", "Price": "130000" },
  { "District Name": "Medchal - Malkajgiri", "State": "Telangana", "Status": "Sold", "Inquiry Count": "1", "Price": "150000" },
  { "District Name": "Sikar", "State": "Rajasthan", "Status": "Sold", "Inquiry Count": "1", "Price": "94300" }
];

const mapped = districtsData.map(d => ({
  name: d['District Name'],
  status: d['Status'],
  notes: \`State: \${d['State']} | Inquiries: \${d['Inquiry Count']} | Price: ₹\${d['Price']}\`,
  id: \`d_imp_\${Math.random().toString(36).substring(2, 9)}\`,
  createdDate: new Date().toISOString()
}));

fetch('http://localhost:5000/api/districts/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(mapped)
}).then(res => {
  if (!res.ok) throw new Error('API Error: ' + res.status);
  return res.json();
}).then(data => {
  console.log('✅ Successfully seeded', data.length, 'districts.');
}).catch(console.error);
