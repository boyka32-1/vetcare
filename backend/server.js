import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import crypto from "crypto";

dotenv.config({ path: "./.env" });

const app = express();

app.use(cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});


// =============================
// ROOT
// =============================
app.get("/", (req, res) => {
  res.send("API running");
});


// =============================
// TEST ROUTE
// =============================
app.get("/test", (req, res) => {
  res.json({
    ok: true,
    message: "backend funcionando correctamente"
  });
});


// =============================
// REGISTER CLIENT
// =============================
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
      WHERE national_id = ?
      AND deleted_at IS NULL
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
        telefono2
      },
    });

  } catch (error) {

    console.error("Error saving client:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
});


// =============================
// GET CLIENTS
// =============================
app.get("/api/clientes", async (req, res) => {
  try {

    const [rows] = await pool.execute(
      `
      SELECT
        id,
        CONCAT(first_name,' ',last_name) AS nombre,
        national_id AS cedula,
        address_line1 AS direccion,
        email AS correo,
        phone_primary AS telefono,
        phone_secondary AS telefono2
      FROM clients
      WHERE deleted_at IS NULL
      ORDER BY first_name,last_name
      `
    );

    return res.json(rows);

  } catch (error) {

    console.error("Error loading clients:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// =============================
// REGISTER PET
// =============================
app.post("/api/mascotas", async (req, res) => {

  try {

    const {
      clienteId,
      nombre,
      edad,
      raza,
      sexo,
      peso,
      observaciones
    } = req.body;

    if (!clienteId || !nombre || !edad || !raza || !sexo || !peso) {
      return res.status(400).json({
        message: "Complete all required pet fields."
      });
    }

    const [clients] = await pool.execute(
      `
      SELECT id
      FROM clients
      WHERE id = ?
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [clienteId]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    const petId = crypto.randomUUID();

    let sexValue = "UNKNOWN";

    if (sexo === "Macho") sexValue = "MALE";
    if (sexo === "Hembra") sexValue = "FEMALE";

    const ageYears = parseInt(edad);
    const weightKg = parseFloat(peso);

    await pool.execute(
      `
      INSERT INTO pets (
        id,
        client_id,
        name,
        breed,
        sex,
        age_years,
        weight_kg,
        weight_text,
        observations,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
      `,
      [
        petId,
        clienteId,
        nombre.trim(),
        raza.trim(),
        sexValue,
        ageYears,
        weightKg,
        peso,
        observaciones || null
      ]
    );

    return res.status(201).json({
      message: "Pet saved successfully."
    });

  } catch (error) {

    console.error("Error saving pet:", error);

    return res.status(500).json({
      message: "Internal server error."
    });
  }
});


// =============================
// GET PETS
// =============================
app.get("/api/mascotas", async (req, res) => {

  try {

    const [rows] = await pool.execute(`
      SELECT
        p.id,
        p.name,
        p.breed,
        p.age_years,
        p.weight_kg,
        c.first_name,
        c.last_name
      FROM pets p
      JOIN clients c ON p.client_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);

    return res.json(rows);

  } catch (error) {

    console.error("Error loading pets:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// =============================
// REGISTER USER
// =============================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password and role are required."
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanRole = role.trim().toUpperCase();

    if (!cleanUsername || !cleanPassword || !cleanRole) {
      return res.status(400).json({
        message: "Username, password and role are required."
      });
    }

    const allowedRoles = ["ADMIN", "DOCTOR", "STAFF"];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role. Allowed: ADMIN, DOCTOR, STAFF"
      });
    }

    const [existingUsers] = await pool.execute(
      `
      SELECT id
      FROM users
      WHERE username = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [cleanUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    await pool.execute(
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
      [userId, cleanUsername, passwordHash, cleanRole]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        username: cleanUsername,
        role: cleanRole
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: error.message,
      code: error.code || null,
      sqlMessage: error.sqlMessage || null
    });
  }
});

// =============================
// LOGIN USER
// =============================
app.post("/api/auth/login", async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT id, username, password_hash, role
      FROM users
      WHERE username = ?
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// =============================
// SERVER
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});