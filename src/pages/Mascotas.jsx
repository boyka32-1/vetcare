import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./mascotas.css";

export default function Mascotas() {
  const navigate = useNavigate();
  const clientes = useMemo(
    () => JSON.parse(localStorage.getItem("clientes")) || [],
    []
  );

  const [form, setForm] = useState({
    clienteId: "",
    nombre: "",
    edad: "",
    raza: "",
    sexo: "",
    peso: "",
    observaciones: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = (e) => {
    e.preventDefault();

    if (clientes.length === 0) {
      alert("Primero debes registrar al menos un cliente.");
      return;
    }

    if (!form.clienteId || !form.nombre || !form.edad || !form.raza || !form.sexo || !form.peso) {
      alert("Completa los campos obligatorios de la mascota.");
      return;
    }

    const clienteSeleccionado = clientes.find((cliente) => cliente.id === form.clienteId);

    const mascotasGuardadas = JSON.parse(localStorage.getItem("mascotas")) || [];

    const nuevaMascota = {
      id: Date.now().toString(),
      ...form,
      clienteNombre: clienteSeleccionado?.nombre || "",
      clienteCedula: clienteSeleccionado?.cedula || "",
    };

    const nuevaLista = [...mascotasGuardadas, nuevaMascota];
    localStorage.setItem("mascotas", JSON.stringify(nuevaLista));

    alert("Mascota guardada correctamente.");

    setForm({
      clienteId: "",
      nombre: "",
      edad: "",
      raza: "",
      sexo: "",
      peso: "",
      observaciones: "",
    });
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
            >
              <option value="">Seleccionar cliente...</option>
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
                value={form.edad}
                onChange={handleChange}
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
                value={form.peso}
                onChange={handleChange}
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

          <button className="ms-btn-primary" type="submit">
            Guardar mascota
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