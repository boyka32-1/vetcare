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
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import cron from "node-cron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

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

const mailTransporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: String(process.env.MAIL_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
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

function formatDateForEmail(dateValue) {
  if (!dateValue) return "fecha no disponible";

  const date = new Date(dateValue);

  return date.toLocaleString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function getReminderConfig(tipo, row) {
  if (tipo === "atrasada") {
    return {
      subject: `Recordatorio de consulta atrasada - ${row.mascota_nombre}`,
      title: "Consulta atrasada",
      message: `La consulta o seguimiento de su mascota <strong>${row.mascota_nombre}</strong> está atrasada.`,
      footer: "Por favor comuníquese con la veterinaria para reagendar.",
      fieldLabel: "Fecha",
      fieldValue: formatDateForEmail(row.proxima_cita),
      notifiedColumn: "atraso_notificado_at",
      logLabel: "consulta atrasada",
    };
  }

  if (tipo === "manana") {
    return {
      subject: `Recordatorio de cita para mañana - ${row.mascota_nombre}`,
      title: "Cita programada para mañana",
      message: `Le recordamos que su mascota <strong>${row.mascota_nombre}</strong> tiene una cita programada para mañana.`,
      footer: "Le esperamos en la veterinaria. Si necesita reprogramar, por favor comuníquese con nosotros.",
      fieldLabel: "Fecha de la cita",
      fieldValue: formatDateForEmail(row.proxima_cita),
      notifiedColumn: "manana_notificado_at",
      logLabel: "cita de mañana",
    };
  }

  throw new Error(`Tipo de recordatorio no soportado: ${tipo}`);
}

async function enviarCorreoConsulta({ connection, row, tipo, marcarNotificado = true }) {
  const config = getReminderConfig(tipo, row);

  const html = `
<div style="font-family: Arial; padding:20px;">
  <div style="text-align:center; margin-bottom:20px;">
    <img src="cid:logoVetcare" width="120" />
  </div>

  <h2 style="text-align:center;">VetCare</h2>
  <h3 style="text-align:center;">${config.title}</h3>

  <p>Hola${row.cliente_nombre ? ` ${row.cliente_nombre}` : ""},</p>

  <p>${config.message}</p>

  <div style="background:#f4e7c5; padding:15px; border-radius:8px;">
    <p><strong>Mascota:</strong> ${row.mascota_nombre}</p>
    <p><strong>Motivo:</strong> ${row.motivo || "No especificado"}</p>
    <p><strong>${config.fieldLabel}:</strong> ${config.fieldValue}</p>
  </div>

  <p>${config.footer}</p>

  <hr />

  <p style="font-size:12px; color:gray;">
    VetCare - Sistema automático
  </p>
</div>
`;

  await mailTransporter.sendMail({
    from: process.env.MAIL_FROM,
    to: row.cliente_correo,
    subject: config.subject,
    html,
    attachments: [
      {
        filename: "logo-vetcare.png",
        path: path.join(__dirname, "../public/logo-vetcare.png"),
        cid: "logoVetcare",
      },
    ],
  });

  if (marcarNotificado) {
    await connection.execute(
      `
      UPDATE consultas
      SET ${config.notifiedColumn} = NOW(),
          updated_at = NOW()
      WHERE id = ?
      `,
      [row.id]
    );
  }

  console.log(
    `Correo enviado por ${config.logLabel}. Consulta: ${row.id}, email: ${row.cliente_correo}`
  );
}

async function enviarCorreosConsultasManana() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.fecha,
        c.proxima_cita,
        c.motivo,
        c.estado,
        c.client_id,
        cl.email AS cliente_correo,
        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        p.name AS mascota_nombre
      FROM consultas c
      INNER JOIN clients cl ON cl.id = c.client_id
      INNER JOIN pets p ON p.id = c.pet_id
      WHERE c.deleted_at IS NULL
        AND cl.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND c.proxima_cita IS NOT NULL
        AND DATE(c.proxima_cita) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND c.recordatorio_manana_enviado_at IS NULL
        AND cl.email IS NOT NULL
        AND TRIM(cl.email) <> ''
      ORDER BY c.proxima_cita ASC
      `
    );

    for (const row of rows) {
      try {
        await mailTransporter.sendMail({
          from: process.env.MAIL_FROM,
          to: row.cliente_correo,
          subject: `Recordatorio de cita para mañana - ${row.mascota_nombre}`,
          html: `
            <div style="font-family: Arial; padding:20px;">
              <h2>VetCare</h2>
              <p>Hola${row.cliente_nombre ? ` ${row.cliente_nombre}` : ""},</p>

              <p>Le recordamos que su mascota <strong>${row.mascota_nombre}</strong> tiene una cita programada para mañana.</p>

              <p><strong>Fecha:</strong> ${formatDateForEmail(row.proxima_cita)}</p>

              <p>Le esperamos en la veterinaria.</p>
            </div>
          `,
        });

        await connection.execute(
          `
          UPDATE consultas
          SET recordatorio_manana_enviado_at = NOW(),
              updated_at = NOW()
          WHERE id = ?
          `,
          [row.id]
        );

        console.log(`Correo de mañana enviado. Consulta: ${row.id}`);
      } catch (mailError) {
        console.error(`Error enviando correo de mañana ${row.id}:`, mailError);
      }
    }
  } catch (error) {
    console.error("Error revisando citas de mañana:", error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No autorizado. Token requerido.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o expirado.",
    });
  }
}

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas solicitudes. Intenta nuevamente en unos minutos.",
  },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de inicio de sesión. Intenta dentro de 15 minutos.",
  },
});

app.use("/api", apiLimiter);

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
app.post("/api/clientes", requireAuth, async (req, res) => {
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
      message:
        "El correo suministrado ya está registrado u ocurrió un error al guardar el cliente.",
    });
  }
});

// =============================
// GET CLIENTS
// Filtro por id
// =============================
app.get("/api/clientes", requireAuth, async (req, res) => {
  try {
    const { id } = req.query;

    let sql = `
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
    `;

    const params = [];

    if (id) {
      sql += ` AND id = ? `;
      params.push(id);
    }

    sql += ` ORDER BY first_name, last_name `;

    const [rows] = await pool.execute(sql, params);

    return res.json(rows);
  } catch (error) {
    console.error("Error loading clients:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
});

// =============================
// REGISTER PET
// =============================
app.post("/api/mascotas", requireAuth, async (req, res) => {
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
// Filtro por id y clienteId
// =============================
app.get("/api/mascotas", requireAuth, async (req, res) => {
  try {
    const { id, clienteId } = req.query;

    let sql = `
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
    `;

    const params = [];

    if (id) {
      sql += ` AND p.id = ? `;
      params.push(id);
    }

    if (clienteId) {
      sql += ` AND p.client_id = ? `;
      params.push(clienteId);
    }

    sql += ` ORDER BY p.name `;

    const [rows] = await pool.execute(sql, params);

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
app.get("/api/doctores", requireAuth, async (req, res) => {
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
// GET TIPOS DE CONSULTA
// =============================
app.get("/api/tipos-consulta", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        id,
        codigo,
        nombre
      FROM tipos_consulta
      WHERE deleted_at IS NULL
      ORDER BY nombre
      `
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error loading tipos_consulta:", error);

    return res.status(500).json({
      message: "Error interno al cargar tipos de consulta.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  }
});

// =============================
// STATS
// =============================
app.get("/api/stats", requireAuth, async (req, res) => {
  try {
    const [[clientesRow]] = await pool.execute(`
      SELECT COUNT(*) AS total
      FROM clients
      WHERE deleted_at IS NULL
    `);

    const [[mascotasRow]] = await pool.execute(`
      SELECT COUNT(*) AS total
      FROM pets
      WHERE deleted_at IS NULL
    `);

    const [[consultasRow]] = await pool.execute(`
      SELECT COUNT(*) AS total
      FROM consultas
      WHERE deleted_at IS NULL
    `);

    const [[alertasRow]] = await pool.execute(`
      SELECT COUNT(*) AS total
      FROM consultas
      WHERE deleted_at IS NULL
        AND (
          (proxima_cita IS NOT NULL AND proxima_cita <= DATE_ADD(CURDATE(), INTERVAL 3 DAY))
          OR estado = 'seguimiento'
        )
    `);

    return res.json({
      clientes: Number(clientesRow.total || 0),
      mascotas: Number(mascotasRow.total || 0),
      consultas: Number(consultasRow.total || 0),
      alertas: Number(alertasRow.total || 0),
    });
  } catch (error) {
    console.error("Error loading stats:", error);

    return res.status(500).json({
      message: "Error interno al cargar estadísticas.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  }
});

// =============================
// ALERTAS
// =============================
app.get("/api/alertas", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        c.id,
        c.pet_id,
        c.client_id,
        c.doctor_id,
        c.fecha,
        c.proxima_cita,
        cl.email AS cliente_correo,
        c.motivo,
        c.diagnostico,
        c.observaciones,
        c.estado,
        c.gravedad,

        p.name AS mascota_nombre,
        p.breed AS mascota_raza,

        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        cl.phone_primary AS cliente_telefono,

        d.full_name AS doctor_nombre
      FROM consultas c
      INNER JOIN pets p
        ON p.id = c.pet_id
      INNER JOIN clients cl
        ON cl.id = c.client_id
      LEFT JOIN doctors d
        ON d.id = c.doctor_id
      WHERE c.deleted_at IS NULL
        AND (
          c.estado = 'seguimiento'
          OR c.proxima_cita IS NOT NULL
        )
      ORDER BY
        CASE
          WHEN c.proxima_cita IS NULL THEN 1
          ELSE 0
        END,
        c.proxima_cita ASC,
        c.created_at DESC
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const alertas = rows.map((row) => {
      let categoria = "proximas";

      if (row.proxima_cita) {
        const cita = new Date(row.proxima_cita);
        cita.setHours(0, 0, 0, 0);

        if (cita < hoy) {
          categoria = "atrasadas";
        } else if (cita.getTime() === hoy.getTime()) {
          categoria = "hoy";
        } else if (cita.getTime() === manana.getTime()) {
          categoria = "manana";
        } else {
          categoria = "proximas";
        }
      } else if (row.estado === "seguimiento") {
        categoria = "proximas";
      }

      return {
        id: row.id,
        pet_id: row.pet_id,
        client_id: row.client_id,
        doctor_id: row.doctor_id,
        fecha: row.fecha,
        proxima_cita: row.proxima_cita,
        motivo: row.motivo,
        diagnostico: row.diagnostico,
        observaciones: row.observaciones,
        estado: row.estado,
        gravedad: row.gravedad,
        mascota_nombre: row.mascota_nombre,
        mascota_raza: row.mascota_raza,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        doctor_nombre: row.doctor_nombre,
        categoria,
      };
    });

    const resumen = {
      atrasadas: alertas.filter((a) => a.categoria === "atrasadas").length,
      hoy: alertas.filter((a) => a.categoria === "hoy").length,
      manana: alertas.filter((a) => a.categoria === "manana").length,
      proximas: alertas.filter((a) => a.categoria === "proximas").length,
      total: alertas.length,
    };

    return res.json({
      resumen,
      alertas,
    });
  } catch (error) {
    console.error("Error loading alertas:", error);

    return res.status(500).json({
      message: "No se pudieron cargar las alertas.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  }
});

// =============================
// REGISTER CONSULTA
// =============================
app.post("/api/consultas", requireAuth, upload.array("adjuntos", 10), async (req, res) => {
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
      meses_gestacion,
      cantidad_crias,
      riesgo_embarazo,
      tipo_parto,
      fecha_probable_parto,
      observaciones_embarazo,
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
`   INSERT INTO consultas (
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
    proxima_cita,
    motivo_seguimiento,
    peso,
    temperatura,
    frecuencia_cardiaca,
    frecuencia_respiratoria,
    presion_arterial,
    saturacion_oxigeno,
    atraso_notificado_at,
    recordatorio_manana_enviado_at,
    deleted_at,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NOW(), NOW())
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

    if (Array.isArray(tiposConsulta) && tiposConsulta.length > 0) {
      for (const tipoCodigo of tiposConsulta) {
        const codigo = String(tipoCodigo || "").trim();
        if (!codigo) continue;

        const [tipoRows] = await connection.execute(
          `
          SELECT id
          FROM tipos_consulta
          WHERE codigo = ?
            AND deleted_at IS NULL
          LIMIT 1
          `,
          [codigo]
        );

        if (tipoRows.length === 0) continue;

        const tipoId = tipoRows[0].id;

        await connection.execute(
          `
          INSERT INTO consulta_tipos (
            id,
            consulta_id,
            tipo_consulta_id,
            deleted_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, NULL, NOW(), NOW())
          `,
          [crypto.randomUUID(), consultaId, tipoId]
        );
      }
    }

    if (Array.isArray(tiposConsulta) && tiposConsulta.includes("emb")) {
      await connection.execute(
        `
        INSERT INTO consulta_embarazo (
          id,
          consulta_id,
          meses_gestacion,
          cantidad_crias,
          riesgo,
          tipo_parto,
          fecha_probable_parto,
          observaciones_embarazo,
          deleted_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
        `,
        [
          crypto.randomUUID(),
          consultaId,
          meses_gestacion ? Number(meses_gestacion) : null,
          cantidad_crias ? Number(cantidad_crias) : null,
          riesgo_embarazo || "bajo",
          tipo_parto || null,
          fecha_probable_parto || null,
          observaciones_embarazo || null,
        ]
      );
    }

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
// CONSULTATION ID
// =============================
app.get("/api/consultas/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [consultas] = await pool.execute(
      `
      SELECT
        c.id,
        c.pet_id,
        c.client_id,
        c.doctor_id,
        c.fecha AS visit_at,
        c.motivo AS reason,
        c.diagnostico AS diagnosis,
        c.observaciones AS notes,
        c.estado,
        c.gravedad,
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
      LEFT JOIN doctors d
        ON d.id = c.doctor_id
      WHERE c.id = ?
        AND c.deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        message: "Consulta no encontrada.",
      });
    }

    const consulta = consultas[0];

    const [tipos] = await pool.execute(
      `
      SELECT
        tc.id,
        tc.codigo,
        tc.nombre
      FROM consulta_tipos ct
      INNER JOIN tipos_consulta tc
        ON tc.id = ct.tipo_consulta_id
      WHERE ct.consulta_id = ?
        AND ct.deleted_at IS NULL
        AND tc.deleted_at IS NULL
      ORDER BY tc.nombre ASC
      `,
      [id]
    );

    const [medicaciones] = await pool.execute(
      `
      SELECT medicamento, indicaciones
      FROM consulta_medicaciones
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    const [analisis] = await pool.execute(
      `
      SELECT analisis, resultado_observacion
      FROM consulta_analisis
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    const [vacunas] = await pool.execute(
      `
      SELECT vacuna, lote_observaciones
      FROM consulta_vacunas
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    const [adjuntos] = await pool.execute(
      `
      SELECT nombre_archivo, ruta_archivo, tipo_archivo, tamano_bytes
      FROM consulta_adjuntos
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    return res.json({
      ...consulta,
      tipos_consulta: tipos.map((t) => t.codigo),
      tipos_consulta_detalle: tipos,
      treatment:
        medicaciones.length > 0
          ? medicaciones.map((m) => m.medicamento).join(", ")
          : null,
      medicaciones,
      analisis,
      vacunas,
      adjuntos,
    });
  } catch (error) {
    console.error("Error loading consulta detail:", error);

    return res.status(500).json({
      message: "Error interno al cargar la consulta.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  }
});

// =============================
// GET PET CLINICAL HISTORY
// =============================
app.get("/api/mascotas/:mascotaId/consultas", requireAuth, async (req, res) => {
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
      const [tipos] = await pool.execute(
        `
        SELECT
          tc.id,
          tc.codigo,
          tc.nombre
        FROM consulta_tipos ct
        INNER JOIN tipos_consulta tc
          ON tc.id = ct.tipo_consulta_id
        WHERE ct.consulta_id = ?
          AND ct.deleted_at IS NULL
          AND tc.deleted_at IS NULL
        ORDER BY tc.nombre ASC
        `,
        [consulta.id]
      );

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
        tipos_consulta: tipos.map((t) => t.codigo),
        tipos_consulta_detalle: tipos,
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
app.post("/api/auth/register", requireAuth, async (req, res) => {
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
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Nombre de usuario y contraseña son requeridos.",
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
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos.",
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
// EMAIL JOB - CONSULTAS ATRASADAS
// =============================
async function enviarCorreosConsultasAtrasadas() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.fecha,
        c.proxima_cita,
        c.motivo,
        c.estado,
        c.client_id,
        cl.email AS cliente_correo,
        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        p.name AS mascota_nombre
      FROM consultas c
      INNER JOIN clients cl
        ON cl.id = c.client_id
      INNER JOIN pets p
        ON p.id = c.pet_id
      WHERE c.deleted_at IS NULL
        AND cl.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND c.proxima_cita IS NOT NULL
        AND DATE(c.proxima_cita) < CURDATE()
        AND c.atraso_notificado_at IS NULL
        AND cl.email IS NOT NULL
        AND TRIM(cl.email) <> ''
      ORDER BY c.proxima_cita ASC
      `
    );

    for (const row of rows) {
      try {
        const asunto = `Recordatorio de consulta atrasada - ${row.mascota_nombre}`;

        const html = `
<div style="font-family: Arial; padding:20px;">

  <div style="text-align:center; margin-bottom:20px;">
    <img src="cid:logoVetcare" width="120" />
  </div>

  <h2 style="text-align:center;">VetCare</h2>

  <p>Hola,</p>

  <p>
    La consulta o seguimiento de su mascota <strong>${row.mascota_nombre}</strong> está atrasada.
  </p>

  <div style="background:#f4e7c5; padding:15px; border-radius:8px;">
    <p><strong>Motivo:</strong> ${row.motivo || "No especificado"}</p>
    <p><strong>Fecha:</strong> ${formatDateForEmail(row.proxima_cita)}</p>
  </div>

  <p>Por favor comuníquese con la veterinaria para reagendar.</p>

  <hr />

  <p style="font-size:12px; color:gray;">
    VetCare - Sistema automático
  </p>

</div>
`;

        await mailTransporter.sendMail({
  from: process.env.MAIL_FROM,
  to: row.cliente_correo,
  subject: asunto,
  html,
  attachments: [
    {
      
      filename: 'logo-vetcare.png',
      path: path.join(__dirname, "../public/logo-vetcare.png"),
      cid: 'logoVetcare'
    }
  ]
});


        await connection.execute(
          `
          UPDATE consultas
          SET atraso_notificado_at = NOW(),
              updated_at = NOW()
          WHERE id = ?
          `,
          [row.id]
        );

        console.log(
          `Correo enviado por consulta atrasada. Consulta: ${row.id}, email: ${row.cliente_correo}`
        );
      } catch (mailError) {
        console.error(
          `Error enviando correo de consulta atrasada ${row.id}:`,
          mailError
        );
      }
    }
  } catch (error) {
    console.error("Error revisando consultas atrasadas:", error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

app.post("/api/consultas/:id/enviar-recordatorio", requireAuth, async (req, res) => {
  const { id } = req.params;

  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.proxima_cita,
        c.motivo,
        cl.email AS cliente_correo,
        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        p.name AS mascota_nombre
      FROM consultas c
      INNER JOIN clients cl ON cl.id = c.client_id
      INNER JOIN pets p ON p.id = c.pet_id
      WHERE c.id = ?
        AND c.deleted_at IS NULL
        AND cl.email IS NOT NULL
        AND TRIM(cl.email) <> ''
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Consulta no válida o sin correo.",
      });
    }

    const row = rows[0];

    await mailTransporter.sendMail({
      from: process.env.MAIL_FROM,
      to: row.cliente_correo,
      subject: `Recordatorio de consulta - ${row.mascota_nombre}`,
      html: `
        <div style="font-family: Arial; padding:20px;">
          <h2>VetCare</h2>
          <p>Hola${row.cliente_nombre ? ` ${row.cliente_nombre}` : ""},</p>
          <p>Le recordamos la consulta de su mascota <strong>${row.mascota_nombre}</strong>.</p>
          <p><strong>Fecha:</strong> ${formatDateForEmail(row.proxima_cita)}</p>
          <p>Gracias por confiar en nosotros.</p>
        </div>
      `,
    });

    return res.json({
      message: "Correo enviado manualmente.",
    });
  } catch (error) {
    console.error("Error manual:", error);

    return res.status(500).json({
      message: "Error enviando correo.",
    });
  } finally {
    if (connection) connection.release();
  }
});
cron.schedule("*/10 * * * *", async () => {
  console.log("Revisando consultas atrasadas y citas de mañana para enviar correos...");
  await enviarCorreosConsultasAtrasadas();
  await enviarCorreosConsultasManana();
});

// =============================
// SERVER
// =============================
const PORT = process.env.PORT || 5000;

enviarCorreosConsultasAtrasadas();
enviarCorreosConsultasManana();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});