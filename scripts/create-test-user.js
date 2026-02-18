// Script to create test users in SmartBid PRO
// Run this after starting the backend server: cargo run (from backend directory)
const http = require('http');

const testUsers = [
  {
    email: "admin@smartbid.com",
    password_hash: "admin123",
    name: "Admin User",
    role: "admin",
    created_at: new Date().toISOString()
  },
  {
    email: "vendor@company.com",
    password_hash: "vendor123",
    name: "Vendor Company",
    role: "vendor",
    created_at: new Date().toISOString()
  },
  {
    email: "vendor1@test.com",
    password_hash: "vendor123",
    name: "John Vendor",
    role: "vendor",
    created_at: new Date().toISOString()
  },
  {
    email: "vendor2@test.com",
    password_hash: "vendor123",
    name: "Jane Vendor",
    role: "vendor",
    created_at: new Date().toISOString()
  },
  {
    email: "bidder1@test.com",
    password_hash: "bidder123",
    name: "Alice Bidder",
    role: "bidder",
    created_at: new Date().toISOString()
  },
  {
    email: "bidder2@test.com",
    password_hash: "bidder123",
    name: "Bob Bidder",
    role: "bidder",
    created_at: new Date().toISOString()
  },
  {
    email: "auditor@test.com",
    password_hash: "auditor123",
    name: "Carol Auditor",
    role: "auditor",
    created_at: new Date().toISOString()
  }
];

function createUser(user) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(user);
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const result = JSON.parse(data);
            console.log(`✅ Created ${result.role} user: ${result.name} (${result.email})`);
            resolve(result);
          } catch (e) {
            console.error(`❌ Error parsing response for ${user.email}:`, e.message);
            resolve(null);
          }
        } else if (res.statusCode === 409) {
          console.log(`⚠️  User already exists: ${user.email}`);
          resolve({ email: user.email, role: user.role, name: user.name });
        } else {
          console.error(`❌ Error creating ${user.role} user (${user.email}): HTTP ${res.statusCode}`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Connection error for ${user.email}:`, error.message);
      console.error(`   Make sure the backend server is running on http://localhost:8000`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function createAllTestUsers() {
  console.log("🚀 Creating test users for SmartBid PRO...\n");
  console.log("Make sure the backend server is running on http://localhost:8000\n");
  
  const results = [];
  
  for (const user of testUsers) {
    const result = await createUser(user);
    if (result) {
      results.push(result);
    }
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`Successfully created ${results.length} out of ${testUsers.length} test users`);
  console.log("=".repeat(60));
  console.log("\n📋 Login Credentials:");
  console.log("─".repeat(60));
  
  testUsers.forEach(user => {
    console.log(`\n${user.role.toUpperCase()}: ${user.name}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password_hash}`);
  });
  
  console.log("\n" + "=".repeat(60));
}

createAllTestUsers();
