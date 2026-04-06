import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./clientes.css";
import {
  applyFieldFormatting,
  validateFields,
  validators,
} from "../utils/formRules";

const API_URL = "http://localhost:5000";

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
  const [fieldErrors, setFieldErrors] = useState({});

  const fieldRules = {
    nombre: {
      required: true,
      formatter: "lettersAndAccents",
      requiredMessage: "El nombre es obligatorio.",
    },
    cedula: {
      required: true,
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.exactLength(13),
          message: "La cédula debe tener exactamente 11 dígitos.",
        },
      ],
    },
    telefono: {
      required: true,
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.minLength(10),
          message: "El teléfono no puede tener menos de 10 dígitos.",
        },
      ],
    },
    telefono2: {
      formatter: "onlyNumbers",
    },
    correo: {
      required: true,
      validate: [
        {
          test: validators.email,
          message: "Correo inválido.",
        },
      ],
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = applyFieldFormatting(name, value, fieldRules);

    if (name === "cedula") {
      const digits = formattedValue.slice(0, 11);

      if (digits.length <= 3) {
        formattedValue = digits;
      } else if (digits.length <= 10) {
        formattedValue = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        formattedValue = `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
      }
    }

    if (name === "telefono" || name === "telefono2") {
      const digits = formattedValue.slice(0, 10);

      if (digits.length <= 3) {
        formattedValue = digits;
      } else if (digits.length <= 6) {
        formattedValue = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        formattedValue = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    }

    setForm((prev) => ({ ...prev, [name]: formattedValue }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setFieldErrors({});

    const errors = validateFields(form, fieldRules);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Corrige los campos.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const response = await fetch(`${API_URL}/api/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const raw = await response.text();

      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!response.ok) {
        setError(data.message || "Could not save client.");
        return;
      }

      setSuccess(data.message || "Client saved successfully.");

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
          <p className="cl-sub">
            Completa la información para registrar al cliente
          </p>
        </div>

        <form className="cl-form" onSubmit={handleGuardar}>
          <div className="cl-grid-2">
            <div className="cl-field">
              <label>
                Nombre <span className="req">*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre"
              />
              {fieldErrors.nombre && <small>{fieldErrors.nombre}</small>}
            </div>

            <div className="cl-field">
              <label>
                Cédula <span className="req">*</span>
              </label>
              <input
                name="cedula"
                value={form.cedula}
                onChange={handleChange}
                placeholder="000-0000000-0"
              />
              {fieldErrors.cedula && <small>{fieldErrors.cedula}</small>}
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-field">
              <label>Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección"
              />
            </div>

            <div className="cl-field">
              <label>Correo</label>
              <input
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="correo@noemail.com"
              />
              {fieldErrors.correo && <small>{fieldErrors.correo}</small>}
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-field">
              <label>
                Teléfono <span className="req">*</span>
              </label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="000-000-0000"
              />
              {fieldErrors.telefono && <small>{fieldErrors.telefono}</small>}
            </div>

            <div className="cl-field">
              <label>Teléfono secundario</label>
              <input
                name="telefono2"
                value={form.telefono2}
                onChange={handleChange}
                placeholder="000-000-0000"
              />
            </div>
          </div>

          {error && <div style={{ color: "red" }}>{error}</div>}
          {success && <div style={{ color: "green" }}>{success}</div>}

          <button className="cl-btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>

          <button
            className="cl-btn-secondary"
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