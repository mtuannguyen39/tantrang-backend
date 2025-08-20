const bcrypt = require("bcryptjs");

async function generatePasswordHash() {
  const password = "admin123";
  const saltRounds = 12;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("Password:", password);
    console.log("Generated hash:", hash);
    console.log("\nSQL to update database:");
    console.log(
      `UPDATE "Admin" SET password = '${hash}' WHERE username = 'superadmin';`
    );

    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log("\nVerification test:", isValid ? "PASS" : "FAIL");
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

generatePasswordHash();
