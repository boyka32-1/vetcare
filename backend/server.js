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

    // allow requests without origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    // allow any localhost port
    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    // reject anything else
    callback(new Error("Not allowed by CORS"));
  }
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

app.get("/", (req, res) => {
  res.send("API running");
});

// REGISTER CLIENT
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

// GET CLIENTS
app.get("/api/clientes", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        id,
        CONCAT(first_name, ' ', last_name) AS nombre,
        national_id AS cedula
      FROM clients
      WHERE deleted_at IS NULL
      ORDER BY first_name, last_name
      `
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error loading clients:", error);
    return res.status(500).json({
      message: "Internal server error."
    });
  }
});

// REGISTER PET
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
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [clienteId]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        message: "The selected client does not exist."
      });
    }

    const petId = crypto.randomUUID();

    let sexValue = "UNKNOWN";
    if (sexo === "Macho") sexValue = "MALE";
    if (sexo === "Hembra") sexValue = "FEMALE";

    const parsedAge = Number.parseInt(edad, 10);
    const ageYears = Number.isNaN(parsedAge) ? null : parsedAge;

    const parsedWeight = Number.parseFloat(
      String(peso).replace(",", ".").replace(/[^\d.]/g, "")
    );

    const weightKg = Number.isNaN(parsedWeight) ? null : parsedWeight;

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
    String(peso).trim(),
    observaciones?.trim() || null
      ]
    );

    return res.status(201).json({
      message: "Pet saved successfully.",
      pet: {
        id: petId,
        clienteId,
        nombre,
        edad,
        raza,
        sexo,
        peso,
        observaciones: observaciones || ""
      }
    });
  } catch (error) {
    console.error("Error saving pet:", error);
    return res.status(500).json({
      message: "Internal server error."
    });
  }
});

//get pets

app.get("/api/mascotas", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        p.id,
        p.client_id AS clienteId,
        p.name AS nombre,
        p.age_years AS edad,
        p.breed AS raza,
        CASE
          WHEN p.sex = 'MALE' THEN 'Macho'
          WHEN p.sex = 'FEMALE' THEN 'Hembra'
          ELSE 'Desconocido'
        END AS sexo,
        COALESCE(p.weight_text, CAST(p.weight_kg AS CHAR)) AS peso,
        p.observations AS observaciones
      FROM pets p
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error loading pets:", error);
    return res.status(500).json({
      message: error.message
    });
  }
});

// LOGIN USER
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});