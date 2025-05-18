import mysql from "mysql2/promise";

// Create a connection pool
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

// Function to validate database connection
export async function validateDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to the database");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    return false;
  }
} 