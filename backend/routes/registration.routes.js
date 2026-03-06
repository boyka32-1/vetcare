import express from "express";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

router.post("/register-client-pets", async (req, res) => {

  const connection = await pool.getConnection();

  try {

    const { client, pets } = req.body;

    if (!client) {
      return res.status(400).json({ message: "Client data is required." });
    }

    if (!pets || pets.length === 0) {
      return res.status(400).json({ message: "At least one pet is required." });
    }

    const {
      fullName,
      nationalId,
      address,
      email,
      phone
    } = client;

    if (!fullName || !nationalId || !address || !email || !phone) {
      return res.status(400).json({ message: "All client fields are required." });
    }

    await connection.beginTransaction();

    const clientId = uuidv4();

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    await connection.execute(
      `
      INSERT INTO clients (
        id,
        first_name,
        last_name,
        national_id,
        email,
        phone_primary,
        address_line1,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
      `,
      [
        clientId,
        firstName,
        lastName,
        nationalId,
        email,
        phone,
        address
      ]
    );

    const insertedPets = [];

    for (const pet of pets) {

      const petId = uuidv4();

      await connection.execute(
        `
        INSERT INTO pets (
          id,
          client_id,
          name,
          breed,
          sex,
          age_years,
          weight_text,
          observations,
          deleted_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
        `,
        [
          petId,
          clientId,
          pet.name,
          pet.breed,
          pet.sex === "Macho" ? "MALE" : "FEMALE",
          Number(pet.age),
          pet.weight,
          pet.observations
        ]
      );

      insertedPets.push({
        id: petId,
        name: pet.name
      });

    }

    await connection.commit();

    return res.status(201).json({
      message: "Client and pets registered successfully",
      clientId,
      pets: insertedPets
    });

  } catch (error) {

    await connection.rollback();

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });

  } finally {

    connection.release();

  }

});

export default router;