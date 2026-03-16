import "./register.css";
import { useState } from "react";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function CreateAccountVetCare() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const { nombre, apellido, email, password, confirmPassword } = formData;

    if (!nombre || !apellido || !email || !password || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email.trim(),
          password: password.trim(),
          role: "ADMIN",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "No se pudo crear la cuenta.");
        return;
      }

      setSuccess("Cuenta creada correctamente. Ahora puedes iniciar sesión.");

      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-body">
      <div className="cl-card">
        <div className="cl-header">
          <div className="cl-header-circle cl-header-circle--left"></div>
          <div className="cl-header-circle cl-header-circle--right"></div>

          <div className="cl-header-content">
            <h1 className="cl-title">Crear cuenta</h1>
            <p className="cl-sub">Llena la informacion para comenzar</p>
          </div>
        </div>

        <div className="cl-form-body">
          <div className="cl-form-container">
            <form className="cl-form" onSubmit={handleSubmit}>
              <div className="cl-field">
                <label>NOMBRE</label>
                <div className="cl-input-wrap">
                  <User size={18} />
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Enter your first name"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cl-field">
                <label>APELLIDO</label>
                <div className="cl-input-wrap">
                  <User size={18} />
                  <input
                    type="text"
                    name="apellido"
                    placeholder="Enter your last name"
                    value={formData.apellido}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cl-field">
                <label>EMAIL</label>
                <div className="cl-input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cl-field">
                <label>CONTRASEÑA</label>
                <div className="cl-input-wrap">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="password"
                    placeholder="Choose a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cl-field">
                <label>CONFIRMAR CONTRASEÑA</label>
                <div className="cl-input-wrap">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
              )}

              {success && (
                <p style={{ color: "green", marginTop: "10px" }}>{success}</p>
              )}

              <button
                type="submit"
                className="cl-btn-primary"
                disabled={loading}
              >
                {loading ? "CREANDO..." : "CREAR CUENTA"}
              </button>

              <Link to="/" className="cl-btn-secondary">
                Back to Login
              </Link>

              <div className="cl-note">
                <ShieldCheck size={16} />
                <span>Secure encrypted connection</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}