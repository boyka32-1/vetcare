import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./mascotas.css";
import {
  applyFieldFormatting,
  validateFields,
  validators,
} from "../utils/formRules";

export default function Mascotas() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  const [form, setForm] = useState({
    clienteId: "",
    nombre: "",
    edad: "",
    raza: "",
    sexo: "",
    peso: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fieldRules = {
    clienteId: {
      required: true,
      requiredMessage: "Debe seleccionar un cliente.",
    },
    nombre: {
      required: true,
      formatter: "lettersAndAccents",
      requiredMessage: "El nombre es obligatorio.",
    },
    edad: {
      required: true,
      formatter: "decimalNumber",
      requiredMessage: "La edad es obligatoria.",
      validate: [
        {
          test: validators.minLength(1),
          message: "La edad es obligatoria.",
        },
      ],
    },
    raza: {
      required: true,
      formatter: "lettersAndAccents",
      requiredMessage: "La raza es obligatoria.",
    },
    sexo: {
      required: true,
      requiredMessage: "El sexo es obligatorio.",
    },
    peso: {
      required: true,
      formatter: "decimalNumber",
      requiredMessage: "El peso es obligatorio.",
      validate: [
        {
          test: validators.minLength(1),
          message: "El peso es obligatorio.",
        },
      ],
    },
    observaciones: {},
  };

  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoadingClientes(true);
        const response = await fetch("http://localhost:5000/api/clientes");
        const raw = await response.text();

        let data = [];
        try {
          data = raw ? JSON.parse(raw) : [];
        } catch {
          data = [];
        }

        if (!response.ok) {
          setError("Could not load clients.");
          return;
        }

        setClientes(data);
      } catch (error) {
        console.error(error);
        setError("Could not connect to the server.");
      } finally {
        setLoadingClientes(false);
      }
    };

    loadClientes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = applyFieldFormatting(name, value, fieldRules);

    if (name === "edad") {
      formattedValue = formattedValue.slice(0, 5);
    }

    if (name === "peso") {
      formattedValue = formattedValue.slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

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

    if (clientes.length === 0) {
      setError("You must register at least one client first.");
      return;
    }

    const errors = validateFields(form, fieldRules);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Corrige los campos requeridos.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/mascotas", {
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
        setError(data.message || `Request failed with status ${response.status}`);
        return;
      }

      setSuccess(data.message || "Pet saved successfully.");

      setForm({
        clienteId: "",
        nombre: "",
        edad: "",
        raza: "",
        sexo: "",
        peso: "",
        observaciones: "",
      });
    } catch (error) {
      console.error(error);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms-body">
      <div className="ms-card">
        <div className="ms-header">
          <h1 className="ms-title">Mascotas</h1>
          <p className="ms-sub">Registra la información de la mascota</p>
        </div>

        <form className="ms-form" onSubmit={handleGuardar}>
          <div className="ms-field">
            <label htmlFor="clienteId">
              Cliente asociado <span className="req">*</span>
            </label>
            <select
              id="clienteId"
              name="clienteId"
              value={form.clienteId}
              onChange={handleChange}
              disabled={loadingClientes}
            >
              <option value="">
                {loadingClientes ? "Cargando clientes..." : "Seleccionar cliente..."}
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} - {cliente.cedula}
                </option>
              ))}
            </select>
            {fieldErrors.clienteId && <small>{fieldErrors.clienteId}</small>}
          </div>

          <div className="ms-field">
            <label htmlFor="nombre">
              Nombre <span className="req">*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
            />
            {fieldErrors.nombre && <small>{fieldErrors.nombre}</small>}
          </div>

          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="edad">
                Edad <span className="req">*</span>
              </label>
              <input
                id="edad"
                name="edad"
                type="text"
                placeholder="Edad"
                value={form.edad ? `${form.edad} años` : ""}
                onChange={(e) => {
                  const clean = e.target.value.replace(" años", "");
                  handleChange({ target: { name: "edad", value: clean } });
                }}
              />
              {fieldErrors.edad && <small>{fieldErrors.edad}</small>}
            </div>

            <div className="ms-field">
              <label htmlFor="raza">
                Raza <span className="req">*</span>
              </label>
              <input
                id="raza"
                name="raza"
                type="text"
                placeholder="Raza"
                value={form.raza}
                onChange={handleChange}
              />
              {fieldErrors.raza && <small>{fieldErrors.raza}</small>}
            </div>
          </div>

          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="sexo">
                Sexo <span className="req">*</span>
              </label>
              <select
                id="sexo"
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
              >
                <option value="">Seleccionar…</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
              {fieldErrors.sexo && <small>{fieldErrors.sexo}</small>}
            </div>

            <div className="ms-field">
              <label htmlFor="peso">
                Peso <span className="req">*</span>
              </label>
              <input
                id="peso"
                name="peso"
                type="text"
                placeholder="Peso"
                value={form.peso ? `${form.peso} kg` : ""}
                onChange={(e) => {
                  const clean = e.target.value.replace(" kg", "");
                  handleChange({ target: { name: "peso", value: clean } });
                }}
              />
              {fieldErrors.peso && <small>{fieldErrors.peso}</small>}
            </div>
          </div>

          <div className="ms-field">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={handleChange}
            />
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

          <button className="ms-btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar mascota"}
          </button>

          <button
            className="ms-link"
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