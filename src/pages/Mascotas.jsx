import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./mascotas.css";

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
     let { name, value }  = e.target;

        if (name === "nombre") {
        value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      }

      if (name === "raza") {
        value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      }

      if (name === "peso") {
        // allow only numbers and one decimal
        value = value.replace(/[^0-9.]/g, "");

        const parts = value.split(".");
        if (parts.length > 2) {
          value = parts[0] + "." + parts.slice(1).join("");
        }
      }


      if (name === "edad") {
        // allow only numbers and one decimal
        value = value.replace(/[^0-9.]/g, "");

        const parts = value.split(".");
        if (parts.length > 2) {
          value = parts[0] + "." + parts.slice(1).join("");
        }
      }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (clientes.length === 0) {
      setError("You must register at least one client first.");
      return;
    }

    if (!form.clienteId || !form.nombre || !form.edad || !form.raza || !form.sexo || !form.peso) {
      setError("Complete the required pet fields.");
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
            <label htmlFor="clienteId">Cliente asociado</label>
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
          </div>

          <div className="ms-field">
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

          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="edad">Edad</label>
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
            </div>

            <div className="ms-field">
              <label htmlFor="raza">Raza</label>
              <input
                id="raza"
                name="raza"
                type="text"
                placeholder="Raza"
                value={form.raza}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="sexo">Sexo</label>
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
            </div>

            <div className="ms-field">
              <label htmlFor="peso">Peso</label>
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