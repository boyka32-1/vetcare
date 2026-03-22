import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: "./.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

const uploadsBaseDir = path.join(__dirname, "uploads");
const consultasUploadsDir = path.join(uploadsBaseDir, "consultas");

if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

if (!fs.existsSync(consultasUploadsDir)) {
  fs.mkdirSync(consultasUploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsBaseDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, consultasUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
    const safeOriginalName = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${uniquePrefix}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

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
    message: "backend funcionando correctamente",
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
        message: "Complete todos los campos requeridos",
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
        message: "Ya existe un cliente con dicha cédula",
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
      message: "Cliente guardado exitosamente",
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
      message: "El correo suministrado ya está registrado u ocurrió un error al guardar el cliente.",
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
        CONCAT(first_name, ' ', last_name) AS nombre,
        national_id AS cedula,
        address_line1 AS direccion,
        email AS correo,
        phone_primary AS telefono,
        phone_secondary AS telefono2
      FROM clients
      WHERE deleted_at IS NULL
      ORDER BY first_name, last_name
      `
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error loading clients:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =============================
// REGISTER PET
// =============================
app.post("/api/mascotas", async (req, res) => {
  try {
    const { clienteId, nombre, edad, raza, sexo, peso, observaciones } = req.body;

    if (!clienteId || !nombre || !edad || !raza || !sexo || !peso) {
      return res.status(400).json({
        message: "Complete todos los campos obligatorios.",
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
        message: "Cliente no encontrado",
      });
    }

    const petId = crypto.randomUUID();

    let sexValue = "UNKNOWN";
    if (sexo === "Macho") sexValue = "MALE";
    if (sexo === "Hembra") sexValue = "FEMALE";

    const ageYears = parseInt(edad, 10);
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
        String(peso),
        observaciones || null,
      ]
    );

    return res.status(201).json({
      message: "Mascota guardada exitosamente.",
      pet: {
        id: petId,
      },
    });
  } catch (error) {
    console.error("Error al guardar la mascota:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});

// =============================
// GET PETS
// =============================
app.get("/api/mascotas", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        p.id,
        p.client_id AS clienteId,
        p.client_id,
        p.name AS nombre,
        p.name,
        p.breed AS raza,
        p.breed,
        p.age_years AS edad,
        p.age_years,
        p.sex AS sexo,
        p.weight_kg AS peso,
        p.weight_kg,
        p.observations AS observaciones,
        c.first_name,
        c.last_name
      FROM pets p
      JOIN clients c ON p.client_id = c.id
      WHERE p.deleted_at IS NULL
        AND c.deleted_at IS NULL
      ORDER BY p.name
      `
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error al cargar las mascotas:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});

// =============================
// GET DOCTORS
// =============================
app.get("/api/doctores", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        id,
        user_id,
        full_name AS nombre,
        specialty,
        license_number,
        created_at,
        updated_at
      FROM doctors
      WHERE deleted_at IS NULL
      ORDER BY full_name
      `
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error loading doctors:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =============================
// REGISTER CONSULTA
// =============================
app.post("/api/consultas", upload.array("adjuntos", 10), async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      pet_id,
      client_id,
      doctor_id,
      fecha,
      hora,
      motivo,
      diagnostico,
      observaciones,
      estado,
      gravedad,
      proxima_cita,
      motivo_seguimiento,
      notas_medicacion,
      notas_analisis,
      lote_vacuna,
      weight,
      temp,
      hr,
      rr,
      bp,
      spo2,
    } = req.body;

    const medicaciones = parseJsonArray(req.body.medicaciones);
    const analisis = parseJsonArray(req.body.analisis);
    const vacunas = parseJsonArray(req.body.vacunas);
    const tiposConsulta = parseJsonArray(req.body.tipos_consulta);

    if (!pet_id || !client_id || !doctor_id || !fecha || !motivo) {
      await connection.rollback();
      return res.status(400).json({
        message: "Faltan campos obligatorios para guardar la consulta.",
      });
    }

    const consultaId = crypto.randomUUID();
    const fechaHora = hora ? `${fecha} ${hora}:00` : `${fecha} 00:00:00`;

    const peso = toNullableNumber(weight);
    const temperatura = toNullableNumber(temp);
    const frecuenciaCardiaca = toNullableNumber(hr);
    const frecuenciaRespiratoria = toNullableNumber(rr);
    const presionArterial = bp ? String(bp) : null;
    const saturacionOxigeno = toNullableNumber(spo2);

    await connection.execute(
      `
      INSERT INTO consultas (
        id,
        pet_id,
        client_id,
        doctor_id,
        fecha,
        motivo,
        diagnostico,
        observaciones,
        estado,
        gravedad,
        tipos_consulta,
        proxima_cita,
        motivo_seguimiento,
        peso,
        temperatura,
        frecuencia_cardiaca,
        frecuencia_respiratoria,
        presion_arterial,
        saturacion_oxigeno,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
      `,
      [
        consultaId,
        pet_id,
        client_id,
        doctor_id,
        fechaHora,
        motivo,
        diagnostico || null,
        observaciones || null,
        estado || "abierta",
        gravedad || "moderada",
        JSON.stringify(tiposConsulta),
        proxima_cita || null,
        motivo_seguimiento || null,
        peso,
        temperatura,
        frecuenciaCardiaca,
        frecuenciaRespiratoria,
        presionArterial,
        saturacionOxigeno,
      ]
    );

    if (Array.isArray(medicaciones) && medicaciones.length > 0) {
      for (const medicamento of medicaciones) {
        const valor = String(medicamento || "").trim();
        if (!valor) continue;

        await connection.execute(
          `
          INSERT INTO consulta_medicaciones (
            id,
            consulta_id,
            medicamento,
            indicaciones,
            deleted_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, NULL, NOW(), NOW())
          `,
          [crypto.randomUUID(), consultaId, valor, notas_medicacion || null]
        );
      }
    }

    if (Array.isArray(analisis) && analisis.length > 0) {
      for (const analisisItem of analisis) {
        const valor = String(analisisItem || "").trim();
        if (!valor) continue;

        await connection.execute(
          `
          INSERT INTO consulta_analisis (
            id,
            consulta_id,
            analisis,
            resultado_observacion,
            deleted_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, NULL, NOW(), NOW())
          `,
          [crypto.randomUUID(), consultaId, valor, notas_analisis || null]
        );
      }
    }

    if (Array.isArray(vacunas) && vacunas.length > 0) {
      for (const vacuna of vacunas) {
        const valor = String(vacuna || "").trim();
        if (!valor) continue;

        await connection.execute(
          `
          INSERT INTO consulta_vacunas (
            id,
            consulta_id,
            vacuna,
            lote_observaciones,
            deleted_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, NULL, NOW(), NOW())
          `,
          [crypto.randomUUID(), consultaId, valor, lote_vacuna || null]
        );
      }
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const publicPath = `/uploads/consultas/${file.filename}`;

        await connection.execute(
          `
          INSERT INTO consulta_adjuntos (
            id,
            consulta_id,
            nombre_archivo,
            ruta_archivo,
            tipo_archivo,
            tamano_bytes,
            deleted_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
          `,
          [
            crypto.randomUUID(),
            consultaId,
            file.originalname,
            publicPath,
            file.mimetype || null,
            file.size || null,
          ]
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      message: "Consulta guardada correctamente.",
      consulta: {
        id: consultaId,
        tipos_consulta: tiposConsulta,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Error saving consulta:", error);

    return res.status(500).json({
      message: "Error interno al guardar la consulta.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// =============================
// GET PET CLINICAL HISTORY
// =============================
app.get("/api/mascotas/:mascotaId/consultas", async (req, res) => {
  try {
    const { mascotaId } = req.params;

    if (!mascotaId) {
      return res.status(400).json({
        message: "ID de mascota es requerido.",
      });
    }

    const [consultas] = await pool.execute(
      `
      SELECT
        c.id,
        c.fecha AS visit_at,
        c.motivo AS reason,
        c.diagnostico AS diagnosis,
        c.observaciones AS notes,
        c.estado,
        c.gravedad,
        c.tipos_consulta,
        c.proxima_cita,
        c.motivo_seguimiento,
        c.peso,
        c.temperatura,
        c.frecuencia_cardiaca,
        c.frecuencia_respiratoria,
        c.presion_arterial,
        c.saturacion_oxigeno,
        d.full_name AS doctor
      FROM consultas c
      LEFT JOIN doctors d ON d.id = c.doctor_id
      WHERE c.pet_id = ?
        AND c.deleted_at IS NULL
      ORDER BY c.fecha DESC, c.created_at DESC
      `,
      [mascotaId]
    );

    const resultado = [];

    for (const consulta of consultas) {
      const [medicaciones] = await pool.execute(
        `
        SELECT medicamento, indicaciones
        FROM consulta_medicaciones
        WHERE consulta_id = ?
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        `,
        [consulta.id]
      );

      const [analisis] = await pool.execute(
        `
        SELECT analisis, resultado_observacion
        FROM consulta_analisis
        WHERE consulta_id = ?
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        `,
        [consulta.id]
      );

      const [vacunas] = await pool.execute(
        `
        SELECT vacuna, lote_observaciones
        FROM consulta_vacunas
        WHERE consulta_id = ?
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        `,
        [consulta.id]
      );

      const [adjuntos] = await pool.execute(
        `
        SELECT nombre_archivo, ruta_archivo, tipo_archivo, tamano_bytes
        FROM consulta_adjuntos
        WHERE consulta_id = ?
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        `,
        [consulta.id]
      );

      resultado.push({
        ...consulta,
        treatment:
          medicaciones.length > 0
            ? medicaciones.map((m) => m.medicamento).join(", ")
            : null,
        medicaciones,
        analisis,
        vacunas,
        adjuntos,
      });
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error loading clinical history:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
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
        message: "Username, password and role are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanRole = role.trim().toUpperCase();

    if (!cleanUsername || !cleanPassword || !cleanRole) {
      return res.status(400).json({
        message: "Username, password and role are required.",
      });
    }

    const allowedRoles = ["ADMIN", "DOCTOR", "STAFF"];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role. Allowed: ADMIN, DOCTOR, STAFF",
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
        message: "Username already exists.",
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
        role: cleanRole,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: error.message,
      code: error.code || null,
      sqlMessage: error.sqlMessage || null,
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
        message: "Username and password are required.",
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
        message: "Invalid username or password",
      });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid username or password",
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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
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