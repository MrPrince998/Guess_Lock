const mariadb = require("./config/mariadb");

async function setupDatabase() {
  try {
    console.log("🔄 Setting up database...");

    const connected = await mariadb.connect();
    if (!connected) {
      console.error("❌ Failed to connect to MariaDB");
      console.log(
        "Make sure MariaDB is running and check your .env configuration"
      );
      process.exit(1);
    }

    await mariadb.initDatabase();
    console.log("✅ Database setup completed successfully!");
    console.log("📋 Created tables: users, games, players, guesses");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure MariaDB is installed and running");
    console.log("2. Check your .env file configuration");
    console.log("3. Ensure the database user has proper permissions");
    process.exit(1);
  }
}

setupDatabase();
