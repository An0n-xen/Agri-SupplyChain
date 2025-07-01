const mysql = require("mysql2");
require("dotenv").config({ path: "../.env" }); // Load environment variables from .env file

// Create connection
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: process.env.DB_PASSWORD, // Add your password here if needed
  database: "supplychain",
});

// Test connection
db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
    console.error("Error code:", err.code);
    console.error("Error number:", err.errno);
    return;
  }

  console.log("✅ Connected to MySQL database successfully!");
  console.log("Connection ID:", db.threadId);

  // List all tables in the database
  db.query("SHOW TABLES", (err, results) => {
    if (err) {
      console.error("Error fetching tables:", err.message);
      db.end();
      return;
    }

    console.log('\n📋 Tables in the "supplychain" database:');
    console.log("==========================================");

    if (results.length === 0) {
      console.log("No tables found in the database.");
    } else {
      results.forEach((row, index) => {
        const tableName = row[`Tables_in_supplychain`];
        console.log(`${index + 1}. ${tableName}`);
      });
    }

    // Optional: Get table details for each table
    if (results.length > 0) {
      console.log("\n📊 Table Details:");
      console.log("==================");

      let tableCount = 0;
      results.forEach((row) => {
        const tableName = row[`Tables_in_supplychain`];

        db.query(`DESCRIBE ${tableName}`, (err, columns) => {
          tableCount++;

          if (err) {
            console.log(
              `\n❌ Error describing table "${tableName}":`,
              err.message
            );
          } else {
            console.log(`\n📄 Table: ${tableName}`);
            console.log("Columns:");
            columns.forEach((col) => {
              console.log(
                `  - ${col.Field} (${col.Type}) ${
                  col.Null === "NO" ? "NOT NULL" : "NULL"
                } ${col.Key ? col.Key : ""}`
              );
            });
          }

          // Close connection after processing all tables
          if (tableCount === results.length) {
            console.log("\n✅ Database inspection complete!");
            db.end();
          }
        });
      });
    } else {
      db.end();
    }
  });
});

// Handle connection errors
db.on("error", (err) => {
  console.error("Database connection error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Database connection was closed.");
  }
  if (err.code === "ER_CON_COUNT_ERROR") {
    console.log("Database has too many connections.");
  }
  if (err.code === "ECONNREFUSED") {
    console.log("Database connection was refused.");
  }
});
