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
    const { name, value } = e.target;
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

      const response = await fetch("http://localhost:5000/api/Clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

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
              />
            </div>

            <div className="cl-field">
              <label htmlFor="cedula">Cédula</label>
              <input
                id="cedula"
                name="cedula"
                type="text"
                placeholder="Cédula"
                value={form.cedula}
                onChange={handleChange}
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
                placeholder="Teléfono"
                value={form.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="telefono2">Teléfono secundario</label>
              <input
                id="telefono2"
                name="telefono2"
                type="tel"
                placeholder="Teléfono secundario"
                value={form.telefono2}
                onChange={handleChange}
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