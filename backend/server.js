import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import registrationRoutes from "./routes/registration.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", registrationRoutes);

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  console.log("Login attempt:", username);

  res.json({
    message: "Login route working",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Register routes
