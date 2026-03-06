import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import crypto from "crypto";

dotenv.config({ path: "./.env" });

const app = express();   // MUST be before routes

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// REGISTER USER
app.post("/api/clientes", async (req, res) => {
  try {
    const { nombre, cedula, direccion, correo, telefono, telefono2 } = req.body;

    if (!nombre || !cedula || !direccion || !correo || !telefono) {
      return res.status(400).json({
        message: "Complete all required client fields.",
      });
    }

    const [existingClients] = await pool.execute(
      `
      SELECT id
      FROM clients
      WHERE national_id = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [cedula.trim()]
    );

    if (existingClients.length > 0) {
      return res.status(409).json({
        message: "A client with that ID already exists.",
      });
    }

    const clientId = crypto.randomUUID();

    const nameParts = nombre.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    await pool.execute(
      `
      INSERT INTO clients (
        id,
        first_name,
        last_name,
        national_id,
        email,
        phone_primary,
        phone_secondary,
        address_line1,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
      `,
      [
        clientId,
        firstName,
        lastName,
        cedula.trim(),
        correo.trim().toLowerCase(),
        telefono.trim(),
        telefono2?.trim() || null,
        direccion.trim(),
      ]
    );

    return res.status(201).json({
      message: "Client saved successfully.",
      client: {
        id: clientId,
        nombre,
        cedula,
        direccion,
        correo,
        telefono,
        telefono2,
      },
    });
  } catch (error) {
    console.error("Error saving client:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
});

//login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT id, username, password_hash, role
      FROM users
      WHERE username = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

