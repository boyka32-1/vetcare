import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./clientes.css";

export default function Clientes() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    direccion: "",
    correo: "",
    telefono: "",
    telefono2: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "nombre") {
    value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  }

    if (name === "cedula") {
      const digits = value.replace(/\D/g, "").slice(0, 11);

      if (digits.length <= 3) {
        value = digits;
      } else if (digits.length <= 10) {
        value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        value = `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
      }
    } else if (name === "telefono" || name === "telefono2") {
      const digits = value.replace(/\D/g, "").slice(0, 10);

      if (digits.length <= 3) {
        value = digits;
      } else if (digits.length <= 6) {
        value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        value = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nombre || !form.cedula || !form.direccion || !form.correo || !form.telefono) {
      setError("Complete the required client fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const raw = await response.text();

      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.message || "Could not save client.");
        return;
      }

      setSuccess("Client saved successfully.");

      setForm({
        nombre: "",
        cedula: "",
        direccion: "",
        correo: "",
        telefono: "",
        telefono2: "",
      });
    } catch (error) {
      console.error(error);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-body">
      <div className="cl-card">
        <div className="cl-header">
          <h1 className="cl-title">Datos del cliente</h1>
          <p className="cl-sub">Completa la información para registrar al cliente</p>
        </div>

        <form className="cl-form" onSubmit={handleGuardar}>
          <div className="cl-grid-2">
            <div className="cl-field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                pattern="[A-Za-záéíóúÁÉÍÓÚñÑ\s]+"
              />
            </div>

            <div className="cl-field">
              <label htmlFor="cedula">Cédula</label>
              <input
                id="cedula"
                name="cedula"
                type="text"
                placeholder="000-0000000-0"
                value={form.cedula}
                onChange={handleChange}
                maxLength={13}
              />
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-field">
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                name="direccion"
                type="text"
                placeholder="Dirección"
                value={form.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                name="correo"
                type="email"
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-field">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="809-555-5555"
                value={form.telefono}
                onChange={handleChange}
                maxLength={12}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="telefono2">Teléfono secundario</label>
              <input
                id="telefono2"
                name="telefono2"
                type="tel"
                placeholder="809-555-5555"
                value={form.telefono2}
                onChange={handleChange}
                maxLength={12}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: "red", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ color: "green", marginBottom: "12px" }}>
              {success}
            </div>
          )}

          <button className="cl-btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>

          <button
            className="cl-link"
            type="button"
            onClick={() => navigate("/menu")}
          >
            Volver al menú
          </button>
        </form>
      </div>
    </div>
  );
}