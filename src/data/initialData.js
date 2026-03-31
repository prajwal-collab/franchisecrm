// ============================================================
// Initial Data – Districts, Users, Sample Leads
// ============================================================

export const STAGES = [
  'New Lead', 'Contacted', 'Interested', 'Webinar Registered',
  'Webinar Attended', '1:1 Scheduled', 'Qualified',
  'Negotiation', 'Closed Won', 'Closed Lost'
];

export const INVESTMENT_CAPACITIES = ['<1L', '1L–3L', '3L–5L', '5L+'];

export const SOURCES = ['Meta', 'LinkedIn', 'Expo', 'Referral', 'Legacy Import', 'Website'];

export const DISTRICT_STATUSES = ['Available', 'Sold', 'Blocked'];

export const PAYMENT_STATUSES = ['Partial', 'Paid Full'];

export const EVENT_TYPES = ['Webinar', '1:1 Meeting'];

export const ROLES = {
  ADMIN: 'Admin',
  CLOSER: 'Closer',
  SDR: 'SDR',
  VIEWER: 'Viewer',
};

// ---- Demo Users ----
export const DEMO_USERS = [
  { id: 'u1', name: 'Arjun Sharma',    email: 'admin@earlyjobs.co.in',  role: 'Admin',  password: 'admin123',  avatar: 'AS' },
  { id: 'u2', name: 'Priya Mehta',     email: 'closer@earlyjobs.co.in', role: 'Closer', password: 'closer123', avatar: 'PM' },
  { id: 'u3', name: 'Rahul Verma',     email: 'sdr1@earlyjobs.co.in',   role: 'SDR',    password: 'sdr123',    avatar: 'RV' },
  { id: 'u4', name: 'Sneha Patel',     email: 'sdr2@earlyjobs.co.in',   role: 'SDR',    password: 'sdr456',    avatar: 'SP' },
  { id: 'u5', name: 'Kiran Reddy',     email: 'viewer@earlyjobs.co.in', role: 'Viewer', password: 'viewer123', avatar: 'KR' },
];

export const SDR_USERS = DEMO_USERS.filter(u => u.role === 'SDR');

// ---- Districts ----
export const INITIAL_DISTRICTS = [
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

export function getInitialDistricts() {
  return INITIAL_DISTRICTS.map((name, i) => ({
    id: `d${i + 1}`,
    name,
    status: 'Available',
    soldDate: null,
    franchiseeId: null,
    createdDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
  }));
}

export function getInitialData() {
  const districts = getInitialDistricts();

  const leads = [
    {
      id: 'l1', firstName: 'Vikram', lastName: 'Singh', phone: '+919876543210',
      email: 'vikram@example.com', districtId: districts[2].id, profession: 'Business Owner',
      investmentCapacity: '5L+', source: 'Meta', notes: 'Very interested, needs ROI details',
      stage: 'Negotiation', score: 82, assignedTo: 'u3',
      createdDate: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'l2', firstName: 'Meena', lastName: 'Joshi', phone: '+919765432109',
      email: 'meena@example.com', districtId: districts[5].id, profession: 'HR Manager',
      investmentCapacity: '3L–5L', source: 'LinkedIn', notes: 'Attended webinar, very engaged',
      stage: 'Qualified', score: 71, assignedTo: 'u4',
      createdDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'l3', firstName: 'Ravi', lastName: 'Kumar', phone: '+919654321098',
      email: 'ravi@example.com', districtId: districts[8].id, profession: 'Teacher',
      investmentCapacity: '1L–3L', source: 'Referral', notes: 'Needs more info about training',
      stage: 'Interested', score: 55, assignedTo: 'u3',
      createdDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'l4', firstName: 'Anjali', lastName: 'Sharma', phone: '+919543210987',
      email: 'anjali@example.com', districtId: districts[20].id, profession: 'Doctor',
      investmentCapacity: '5L+', source: 'Expo', notes: 'Met at Mumbai Expo, very warm lead',
      stage: 'Webinar Registered', score: 63, assignedTo: 'u4',
      createdDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'l5', firstName: 'Suresh', lastName: 'Nair', phone: '+919432109876',
      email: 'suresh@example.com', districtId: districts[30].id, profession: 'Engineer',
      investmentCapacity: '3L–5L', source: 'Website', notes: 'Filled form late night, follow up asap',
      stage: 'New Lead', score: 40, assignedTo: 'u3',
      createdDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'l6', firstName: 'Pooja', lastName: 'Reddy', phone: '+919321098765',
      email: 'pooja@example.com', districtId: districts[15].id, profession: 'Entrepreneur',
      investmentCapacity: '5L+', source: 'Meta', notes: 'Running restaurant chain, looking to diversify',
      stage: 'Contacted', score: 48, assignedTo: 'u4',
      createdDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const franchisees = [
    {
      id: 'f1', name: 'Deepak Enterprises', contactPerson: 'Deepak Gupta',
      phone: '+919210987654', email: 'deepak@example.com',
      districtId: districts[50].id, onboardingDate: new Date(Date.now() - 20 * 86400000).toISOString(),
      tokenAmount: 50000, committedAmount: 300000, receivedAmount: 200000,
      paymentStatus: 'Partial', sourceOfLead: 'Meta', notes: 'Training scheduled next week',
      createdDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  // Mark that district as Sold
  const soldDistrictIdx = districts.findIndex(d => d.id === districts[50].id);
  if (soldDistrictIdx !== -1) {
    districts[soldDistrictIdx].status = 'Sold';
    districts[soldDistrictIdx].soldDate = new Date(Date.now() - 20 * 86400000).toISOString();
    districts[soldDistrictIdx].franchiseeId = 'f1';
  }

  const tasks = [
    { id: 't1', title: 'Call lead within 24h', leadId: 'l5', assignedTo: 'u3', dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), done: false, createdDate: new Date().toISOString() },
    { id: 't2', title: 'Schedule webinar invitation', leadId: 'l3', assignedTo: 'u3', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), done: false, createdDate: new Date().toISOString() },
    { id: 't3', title: 'Send reminder to lead about meeting tomorrow', leadId: 'l4', assignedTo: 'u4', dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), done: false, createdDate: new Date().toISOString() },
    { id: 't4', title: 'Begin negotiation', leadId: 'l1', assignedTo: 'u2', dueDate: new Date(Date.now() - 2 * 86400000).toISOString(), done: false, createdDate: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: 't5', title: 'Send onboarding pack and payment link', franchiseeId: 'f1', assignedTo: 'u2', dueDate: new Date(Date.now() - 19 * 86400000).toISOString(), done: true, createdDate: new Date(Date.now() - 20 * 86400000).toISOString() },
  ];

  const meetings = [
    {
      id: 'm1', leadId: 'l4', eventType: 'Webinar', eventLink: 'https://meet.google.com/example1',
      googleMeetLink: 'https://meet.google.com/example1',
      scheduledDateTime: new Date(Date.now() + 2 * 86400000).toISOString(),
      attended: false, attendedDateTime: null,
      createdDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  return { districts, leads, franchisees, tasks, meetings };
}
