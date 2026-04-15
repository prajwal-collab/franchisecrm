async function testLogin() {
  const email = 'dipanjana@earlyjobs.in';
  const password = 'password123';
  const url = 'http://localhost:5000/api/auth/login';

  try {
    console.log(`Testing login for ${email} with password: ${password}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful!');
      console.log('User data:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json();
      console.log(`Login failed with status ${response.status}:`, errorData.message);
    }
  } catch (err) {
    console.error('Login failed:', err.message);
  }
}

testLogin();
