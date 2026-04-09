require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI;

const DistrictSchema = new mongoose.Schema({
  id: String, name: String, status: { type: String, default: 'Available' }, notes: String
}, { strict: false });

const FranchiseeSchema = new mongoose.Schema({
  id: String, name: String, contactPerson: String, phone: String, email: String, 
  districtId: String, onboardingDate: Date, committedAmount: Number, 
  receivedAmount: Number, paymentStatus: String, notes: String
}, { strict: false });

const LeadSchema = new mongoose.Schema({
  id: String, firstName: String, lastName: String, phone: String, email: String, 
  districtId: String, stage: String, score: Number, updatedDate: { type: Date, default: Date.now }
}, { strict: false });

const District = mongoose.model('District', DistrictSchema);
const Franchisee = mongoose.model('Franchisee', FranchiseeSchema);
const Lead = mongoose.model('Lead', LeadSchema);

const INITIAL_DISTRICTS = [
  'Adilabad', 'Agar Malwa', 'Agra', 'Ahmednagar', 'Aizawl', 'Ajmer', 'Akola', 'Alappuzha',
  'Aligarh', 'Alipurduar', 'Almora', 'Alwar', 'Ambala', 'Ambedkar Nagar', 'Amravati', 'Amreli',
  'Amritsar', 'Amroha', 'Anand', 'Anantapur', 'Anantnag', 'Angul', 'Anjaw', 'Anuppur',
  'Araria', 'Aravalli', 'Ariyalur', 'Arwal', 'Ashoknagar', 'Auraiya', 'Aurangabad (Bihar)',
  'Aurangabad (MH)', 'Azamgarh', 'Bagalkot', 'Bageshwar', 'Baghpat', 'Bahraich', 'Bajali',
  'Baksa', 'Balaghat', 'Balangir', 'Balasore', 'Ballia', 'Balod', 'Baloda Bazar', 'Balrampur',
  'Banaskantha', 'Banda', 'Bandipora', 'Bangalore Rural', 'Bangalore Urban', 'Banka', 'Bankura',
  'Banswara', 'Barabanki', 'Baramulla', 'Baran', 'Bardhaman', 'Bareilly', 'Bargarh', 'Barmer',
  'Barnala', 'Barpeta', 'Barwani', 'Bastar', 'Basti', 'Bathinda', 'Baudh', 'Begusarai',
  'Belgaum', 'Bellary', 'Betul', 'Bhadrak', 'Bhagalpur', 'Bhandara', 'Bharatpur', 'Bharuch',
  'Bhavnagar', 'Bhilwara', 'Bhind', 'Bhiwani', 'Bhojpur', 'Bhopal', 'Bidar', 'Bijapur',
  'Bijnor', 'Bikaner', 'Bilaspur (CG)', 'Bilaspur (HP)', 'Birbhum', 'Bishnupur', 'Bokaro',
  'Bongaigaon', 'Boudh', 'Budaun', 'Bulandshahr', 'Buldhana', 'Bundi', 'Burhanpur', 'Buxar',
  'Cachar', 'Central Delhi', 'Chamarajanagar', 'Chamba', 'Chamoli', 'Champawat', 'Champhai',
  'Chandauli', 'Chandel', 'Chandigarh', 'Chandrapur', 'Changlang', 'Chatra', 'Chennai',
  'Chhatarpur', 'Chhindwara', 'Chhota Udaipur', 'Chitradurga', 'Chitrakoot', 'Chittoor',
  'Chittorgarh', 'Churu', 'Coimbatore', 'Cooch Behar', 'Cuddalore', 'Cuttack', 'Dahod',
  'Dakshin Dinajpur', 'Daman', 'Damoh', 'Dang', 'Dantewada', 'Darbhanga', 'Darjeeling',
  'Darrang', 'Datia', 'Dausa', 'Davanagere', 'Debagarh', 'Deoghar', 'Deoria', 'Devbhoomi Dwarka',
  'Dewas', 'Dhalai', 'Dhamtari', 'Dhanbad', 'Dhar', 'Dhemaji', 'Dhenkanal', 'Dhule',
  'Dibang Valley', 'Dibrugarh', 'Dima Hasao', 'Dimapur', 'Dindigul', 'Dindori', 'Diu',
  'Doda', 'Dumka', 'Dungarpur', 'Durg', 'East Champaran', 'East Delhi', 'East Garo Hills',
  'East Godavari', 'East Jaintia Hills', 'East Kameng', 'East Khasi Hills', 'East Siang',
  'East Sikkim', 'East Singhbhum', 'Ernakulam', 'Erode', 'Etah', 'Etawah', 'Faizabad',
  'Faridabad', 'Faridkot', 'Farrukhabad', 'Fatehabad', 'Fatehgarh Sahib', 'Fatehpur', 'Fazilka',
  'Firozabad', 'Firozpur', 'Gadag', 'Gandhinagar', 'Ganganagar', 'Ganjam', 'Gautam Buddha Nagar',
  'Gaya', 'Ghaziabad', 'Ghazipur', 'Giridih', 'Gir Somnath', 'Goalpara', 'Godda', 'Golaghat',
  'Gomati', 'Gonda', 'Gopalganj', 'Gorakhpur', 'Gulbarga', 'Gumla', 'Guntur', 'Gurdaspur',
  'Gurugram', 'Gwalior', 'Hailakandi', 'Hamirpur (HP)', 'Hamirpur (UP)', 'Hanumangarh',
  'Hapur', 'Hardoi', 'Haridwar', 'Hassan', 'Hathras', 'Haveri', 'Hazaribagh', 'Hingoli',
  'Hisar', 'Hooghly', 'Hoshangabad', 'Hoshiarpur', 'Howrah', 'Hyderabad', 'Idukki',
  'Imphal East', 'Imphal West', 'Indore', 'Jabalpur', 'Jagatsinghpur', 'Jaipur', 'Jaisalmer',
  'Jajpur', 'Jalandhar', 'Jalaun', 'Jalgaon', 'Jalna', 'Jalore', 'Jammu', 'Jamnagar',
  'Jamtara', 'Jamui', 'Janjgir-Champa', 'Jashpur', 'Jaunpur', 'Jehanabad', 'Jhabua',
  'Jhajjar', 'Jhalawar', 'Jhansi', 'Jharsuguda', 'Jhunjhunu', 'Jind', 'Jodhpur', 'Jorhat',
  'Junagadh', 'Kabirdham', 'Kachchh', 'Kadapa', 'Kaimur', 'Kaithal', 'Kakching', 'Kakinada',
  'Kalahandi', 'Kalaburagi', 'Kamrup', 'Kamrup Metropolitan', 'Kanchipuram', 'Kandhamal',
  'Kangra', 'Kanker', 'Kannauj', 'Kannur', 'Kanpur Dehat', 'Kanpur Nagar', 'Kanyakumari',
  'Karaikal', 'Karauli', 'Karbi Anglong', 'Kargil', 'Karimnagar', 'Karnal', 'Karur',
  'Kasaragod', 'Kasganj', 'Kathua', 'Katihar', 'Katni', 'Kaushambi', 'Kendrapara',
  'Kendujhar', 'Khagaria', 'Khammam', 'Khandwa', 'Khargone', 'Kheda', 'Khordha', 'Khowai',
  'Khunti', 'Kinnaur', 'Kishanganj', 'Kishtwar', 'Kodagu', 'Koderma', 'Kohima', 'Kokrajhar',
  'Kolar', 'Kolasib', 'Kolhapur', 'Kolkata', 'Koppal', 'Koraput', 'Korba', 'Korea',
  'Kota', 'Kottayam', 'Kozhikode', 'Krishna', 'Krishnagiri', 'Kullu', 'Kumar', 'Kumbakonam',
  'Kupwara', 'Kurnool', 'Kurukshetra', 'Lakhimpur', 'Lakhimpur Kheri', 'Lakhisarai',
  'Latur', 'Lawngtlai', 'Lepa Rada', 'Lohardaga', 'Lower Dibang Valley', 'Lower Subansiri',
  'Lucknow', 'Ludhiana', 'Lunglei', 'Madhepura', 'Madhubani', 'Madurai', 'Mahabubabad',
  'Mahabubnagar', 'Maharajganj', 'Mahendragarh', 'Mahisagar', 'Mahoba', 'Mainpuri',
  'Malappuram', 'Malda', 'Malkangiri', 'Mamit', 'Mandi', 'Mandla', 'Mandsaur', 'Mandya',
  'Mansa', 'Mathura', 'Mau', 'Mayurbhanj', 'Medak', 'Mehsana', 'Mewat', 'Mirzapur',
  'Moga', 'Mokama', 'Morbi', 'Morena', 'Morigaon', 'Muktsar', 'Mumbai City', 'Mumbai Suburban',
  'Munger', 'Murshidabad', 'Muzaffarnagar', 'Muzaffarpur', 'Mysuru', 'Nabarangpur', 'Nadia',
  'Nagaon', 'Nagapattinam', 'Nagaur', 'Nagpur', 'Nainital', 'Nalanda', 'Namchi', 'Namsai',
  'Nanded', 'Nandurbar', 'Narayanpur', 'Narmada', 'Narsinghpur', 'Nashik', 'Navalgund',
  'Navapara', 'Navsari', 'Nawada', 'New Delhi', 'Nilgiris', 'Nizamabad', 'North Delhi',
  'North Garo Hills', 'North Goa', 'North Sikkim', 'North Tripura', 'Nuapada', 'Osmanabad',
  'Pakur', 'Palakkad', 'Palamu', 'Palghar', 'Pali', 'Panchkula', 'Panchmahal', 'Panipat',
  'Parbhani', 'Patan', 'Pathanamthitta', 'Patna', 'Pauri Garhwal', 'Perambalur', 'Phek',
  'Pithoragarh', 'Poonch', 'Porbandar', 'Pratapgarh (UP)', 'Pratapgarh (RJ)', 'Puducherry',
  'Pune', 'Puri', 'Purnia', 'Purulia', 'Raibareli', 'Raigarh', 'Raipur', 'Raisen', 'Rajkot',
  'Rajnandgaon', 'Rajsamand', 'Ramban', 'Ramgarh', 'Rampur', 'Ranchi', 'Rangareddy',
  'Ratnagiri', 'Rayagada', 'Reasi', 'Rewa', 'Rewari', 'Rohtas', 'Rudraprayag', 'Rupnagar',
  'Sabar Kantha', 'Sagar', 'Saharanpur', 'Saharsa', 'Salem', 'Samastipur', 'Samba',
  'Sambalpur', 'Sambhal', 'Sangli', 'Sangareddy', 'Sangrur', 'Sant Kabir Nagar', 'Saran',
  'Satara', 'Satna', 'Sawai Madhopur', 'Sehore', 'Senapati', 'Seoni', 'Sepahijala',
  'Serchhip', 'Shahdara', 'Shahdol', 'Shahjahanpur', 'Sheikhpura', 'Sheohar', 'Sheopur',
  'Shimla', 'Shivamogga', 'Shivpuri', 'Shopian', 'Shravasti', 'Siddharth Nagar', 'Sidhi',
  'Sikar', 'Simdega', 'Sindhudurg', 'Singrauli', 'Sirmaur', 'Sirsa', 'Sitamarhi',
  'Sitapur', 'Sivaganga', 'Siwan', 'Solan', 'Solapur', 'Sonbhadra', 'Sonipat', 'Sonitpur',
  'South Delhi', 'South Garo Hills', 'South Goa', 'South Salmara-Mankachar', 'South Sikkim',
  'South Tripura', 'South West Delhi', 'Srikakulam', 'Srinagar', 'Sukma', 'Sundergarh',
  'Supaul', 'Surat', 'Surendranagar', 'Surguja', 'Tamenglong', 'Tapi', 'Tarn Taran',
  'Tawang', 'Tehri Garhwal', 'Tengnoupal', 'Thane', 'Thanjavur', 'The Dangs', 'Thoubal',
  'Tirap', 'Tiruchirappalli', 'Tirunelveli', 'Tirupati', 'Tirupur', 'Tiruvallur',
  'Tiruvannamalai', 'Tiruvarur', 'Tonk', 'Tuensang', 'Tumkur', 'Udaipur', 'Udalguri',
  'Udupi', 'Ujjain', 'Ukhrul', 'Umaria', 'Una', 'Unnao', 'Upper Siang', 'Upper Subansiri',
  'Uttar Kannada', 'Uttara Kannada', 'Uttarkashi', 'Vadodara', 'Vaishali', 'Valsad',
  'Varanasi', 'Vellore', 'Vidisha', 'Virudhunagar', 'Visakhapatnam', 'Vizianagaram',
  'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Wardha', 'Washim', 'Wayanad',
  'West Champaran', 'West Delhi', 'West Garo Hills', 'West Godavari', 'West Jaintia Hills',
  'West Kameng', 'West Karbi Anglong', 'West Khasi Hills', 'West Siang', 'West Sikkim',
  'West Tripura', 'Wokha', 'Yadgir', 'Yamunanagar', 'Yanam', 'Yingkiong', 'Zunheboto'
];

const partnersData = [
  { name: 'Ayush Beriwal', district: 'Surat', date: '2025-05-29', committed: 70000, received: 70000, status: 'Paid full', notes: '' },
  { name: 'Jyotiranajan', district: 'Mohali', date: '2025-05-31', committed: 70000, received: 70000, status: 'Paid full', notes: '' },
  { name: 'Sanjay Kansal', district: 'Chandigarh', date: '2025-06-05', committed: 70000, received: 70000, status: 'Paid full', notes: '' },
  { name: 'Sagil', district: 'Rampur', date: '2025-06-08', committed: 70000, received: 70000, status: 'Paid full', notes: '' },
  { name: 'Pragathi', district: 'Hyderabad', date: '2025-06-16', committed: 60000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Selvaraj', district: 'Chennai', date: '2025-06-28', committed: 118000, received: 118000, status: 'Paid full', notes: '' },
  { name: 'Shivam & Shashank', district: 'Faridabad', date: '2025-07-03', committed: 55000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Deval', district: 'Bhopal', date: '2025-07-04', committed: 85000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Bharat', district: 'Chengalpattu', date: '2025-07-13', committed: 89000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'JPS Aneja', district: 'Sonipat', date: '2025-07-15', committed: 89000, received: 89000, status: 'Paid full', notes: '' },
  { name: 'Saradh Kumar', district: 'Patna', date: '2025-07-17', committed: 94000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Eulalia', district: 'Vishakhapatnam', date: '2025-07-29', committed: 84700, received: 20000, status: 'Partial', notes: 'Token only' },
  { name: 'Aayush', district: 'Lucknow', date: '2025-07-31', committed: 118000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Vishal Vishnoi', district: 'Ghaziabad', date: '2025-07-31', committed: 118000, received: 10000, status: 'Partial', notes: 'Token only' },
  { name: 'Jerry & Joe', district: 'Bangalore Urban', date: '2025-08-21', committed: 85000, received: 10000, status: 'Partial', notes: 'Token only' },
  { name: 'Lakshmi PV', district: 'Coimbatore', date: '2025-08-27', committed: 105000, received: 105000, status: 'Paid full', notes: '' },
  { name: 'Praveen Kumar', district: 'Gulbarga', date: '2025-08-30', committed: 118000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'P S Patil', district: 'Bijapur', date: '2025-08-31', committed: 118000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Siva Mohan Reddy', district: 'Ananthpur', date: '2025-08-31', committed: 100000, received: 11000, status: 'Partial', notes: 'Token only' },
  { name: 'Ravi Kumar', district: 'Ramnagara', date: '2025-09-02', committed: 100000, received: 20000, status: 'Partial', notes: 'Token only' },
  { name: 'Sandesh', district: 'Mangalore', date: '2025-09-04', committed: 100000, received: 20000, status: 'Partial', notes: 'Token only' },
  { name: 'Devi Dayal Sharma', district: 'Kurukshetra', date: null, committed: 100000, received: 25000, status: 'Partial', notes: 'No onboarding date' },
  { name: 'Veeresh', district: 'Bellary', date: null, committed: 130000, received: 50000, status: 'Partial', notes: 'No onboarding date' },
  { name: 'Vaibhav & Ashish', district: 'Medchal - Malkajgiri', date: null, committed: 150000, received: 25000, status: 'Partial', notes: 'No onboarding date' },
  { name: 'Sandeep', district: 'Sikar', date: null, committed: 94300, received: 94300, status: 'Paid full', notes: 'Paid full, no date' }
];

async function seed() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    console.log('🧹 Clearing old data...');
    await District.deleteMany({});
    await Franchisee.deleteMany({});
    await Lead.deleteMany({});

    console.log('🏙️ Seeding Districts...');
    const districtDocs = await District.insertMany(INITIAL_DISTRICTS.map(name => ({
      name,
      id: crypto.randomUUID(),
      status: partnersData.some(p => p.district === name) ? 'Sold' : 'Available'
    })));
    console.log(`✅ Seeded ${districtDocs.length} districts.`);

    console.log('🤝 Seeding Franchise Partners...');
    const partnerDocs = await Franchisee.insertMany(partnersData.map(p => {
      const match = districtDocs.find(d => 
        d.name.toLowerCase().includes(p.district.toLowerCase()) || 
        p.district.toLowerCase().includes(d.name.toLowerCase())
      );
      return {
        id: crypto.randomUUID(),
        name: p.name,
        districtId: match ? match.id : null,
        onboardingDate: p.date ? new Date(p.date) : new Date(),
        committedAmount: p.committed,
        receivedAmount: p.received,
        paymentStatus: p.status === 'Paid full' ? 'Paid Full' : 'Partial',
        notes: p.notes
      };
    }));
    console.log(`✅ Seeded ${partnerDocs.length} franchisees.`);

    console.log('📈 Seeding Sample Leads...');
    const sampleLeads = [
      { firstName: 'Rahul', lastName: 'Sharma', phone: '9876543210', email: 'rahul@gmail.com', stage: 'New Lead', score: 45 },
      { firstName: 'Priya', lastName: 'Patel', phone: '8765432109', email: 'priya@gmail.com', stage: 'Contacted', score: 60 },
      { firstName: 'Amit', lastName: 'Kumar', phone: '7654321098', email: 'amit@gmail.com', stage: 'Interested', score: 75 },
      { firstName: 'Sneha', lastName: 'Nair', phone: '6543210987', email: 'sneha@email.com', stage: 'Interested', score: 80 },
      { firstName: 'Vikram', lastName: 'Singh', phone: '5432109876', email: 'vikram@yahoo.com', stage: 'Negotiation', score: 90 },
      { firstName: 'Kavita', lastName: 'Reddy', phone: '4321098765', email: 'kavita@hotmail.com', stage: 'Interested', score: 65 },
      { firstName: 'Siddharth', lastName: 'Gupta', phone: '3210987654', email: 'sid@gmail.com', stage: 'Contacted', score: 55 },
      { firstName: 'Anjali', lastName: 'Das', phone: '2109876543', email: 'anjali@outlook.com', stage: 'New Lead', score: 30 },
      { firstName: 'Manish', lastName: 'Verma', phone: '1098765432', email: 'manish@gmail.com', stage: 'Interested', score: 70 },
      { firstName: 'Deepa', lastName: 'Joshi', phone: '0987654321', email: 'deepa@gmail.com', stage: 'Negotiation', score: 85 }
    ];
    await Lead.insertMany(sampleLeads.map(l => ({
      ...l,
      id: crypto.randomUUID(),
      updatedDate: new Date()
    })));
    console.log('✅ Seeded 10 sample leads.');

    console.log('✨ Seeding sequence completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
