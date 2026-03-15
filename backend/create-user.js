import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

async function createUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const username = "admin";
    const password = "Admin123*";
    const role = "ADMIN";

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await connection.execute(
      `
      INSERT INTO users (
        id,
        username,
        password_hash,
        role,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, NULL, NOW(), NOW())
      `,
      [id, username, passwordHash, role]
    );

    console.log("User created successfully.");
    console.log("Username:", username);
    console.log("Password:", password);

    await connection.end();
  } catch (error) {
    console.error("Error creating user:", error.message);
  }
}

createUser();