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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = (e) => {
    e.preventDefault();

    // Por ahora solo frontend: aquí luego conectas backend
    console.log("CLIENTE GUARDADO (mock):", form);

    // Mini feedback rápido
    alert("Cliente guardado (simulación).");

    // Si quieres que vuelva al menú después de guardar:
    // navigate("/menu");
  };

  return (
    <div className="cl-body">
      <div className="cl-card">
        <div className="cl-header">
          <h1 className="cl-title">Datos del cliente</h1>
          <p className="cl-sub">Completa la información para registrar al cliente</p>
        </div>

        <form className="cl-form" onSubmit={handleGuardar}>
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

          <button className="cl-btn-primary" type="submit">
            Guardar
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