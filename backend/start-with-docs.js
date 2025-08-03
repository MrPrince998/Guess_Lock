#!/usr/bin/env node

const { exec } = require("child_process");
const open = require("open");

console.log("🔄 Starting Guess the Number Game API...\n");

// Start the server
const serverProcess = exec("npm run dev", (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Server error: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});

// Wait a moment for server to start, then open documentation
setTimeout(() => {
  console.log("📖 Opening API Documentation in browser...\n");

  // Try to open the documentation
  open("http://localhost:3000/api-docs")
    .then(() => {
      console.log("✅ API Documentation opened successfully!");
      console.log("🌐 Available endpoints:");
      console.log("   • API Docs: http://localhost:3000/api-docs");
      console.log("   • API Root: http://localhost:3000/");
      console.log("   • Health: http://localhost:3000/health");
      console.log("   • Auth: http://localhost:3000/api/auth");
      console.log("   • Games: http://localhost:3000/api/game");
      console.log("\n💡 Use Ctrl+C to stop the server");
    })
    .catch(() => {
      console.log("⚠️  Could not auto-open browser. Please visit:");
      console.log("📖 http://localhost:3000/api-docs");
    });
}, 3000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  serverProcess.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  serverProcess.kill();
  process.exit(0);
});
