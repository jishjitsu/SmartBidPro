// Script to create a test user in SmartBid PRO
const testUser = {
  email: "test@smartbid.com",
  password_hash: "password123",
  name: "Test User",
  role: "vendor",
  created_at: new Date().toISOString()
};

async function createTestUser() {
  try {
    console.log("Creating test user...");
    console.log("Email:", testUser.email);
    console.log("Password: password123");
    console.log("Role:", testUser.role);
    
    const response = await fetch("http://localhost:8000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create user: ${error}`);
    }

    const data = await response.json();
    console.log("\n✅ Test user created successfully!");
    console.log("User ID:", data.id);
    console.log("Email:", data.email);
    console.log("Name:", data.name);
    console.log("Role:", data.role);
    console.log("\nYou can now login with:");
    console.log("  Email: test@smartbid.com");
    console.log("  Password: password123");
  } catch (error) {
    console.error("\n❌ Error creating test user:");
    console.error(error.message);
    console.error("\nMake sure the backend server is running on http://localhost:8000");
  }
}

createTestUser();
