import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./registro.css";

export default function Registro() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [clientesResponse, mascotasResponse] = await Promise.all([
          fetch("http://localhost:5000/api/clientes"),
          fetch("http://localhost:5000/api/mascotas"),
        ]);

        const clientesRaw = await clientesResponse.text();
        const mascotasRaw = await mascotasResponse.text();

        let clientesData = [];
        let mascotasData = [];

        try {
          clientesData = clientesRaw ? JSON.parse(clientesRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading clients.");
        }

        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading pets.");
        }

        if (!clientesResponse.ok) {
          throw new Error(clientesData.message || "Could not load clients.");
        }

        if (!mascotasResponse.ok) {
          throw new Error(mascotasData.message || "Could not load pets.");
        }

        setClientes(clientesData);
        setMascotas(mascotasData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load the registry.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const mascotasAgrupadas = useMemo(() => {
    const mapa = {};

    for (const mascota of mascotas) {
      if (!mapa[mascota.clienteId]) {
        mapa[mascota.clienteId] = [];
      }
      mapa[mascota.clienteId].push(mascota);
    }

    return mapa;
  }, [mascotas]);

  return (
    <div className="rg-body">
      <div className="rg-card">
        <div className="rg-topbar">
          <button
            className="rg-back"
            type="button"
            onClick={() => navigate("/menu")}
          >
            ← Volver
          </button>

          <div className="rg-title">
            <h1>Registro</h1>
            <p>Clientes y mascotas registradas</p>
          </div>
        </div>

        <div className="rg-list-wrap">
          {loading ? (
            <div className="rg-empty">
              <h2>Cargando registros...</h2>
            </div>
          ) : error ? (
            <div className="rg-empty">
              <h2>Error al cargar</h2>
              <p>{error}</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="rg-empty">
              <h2>No hay clientes registrados</h2>
              <p>Primero registra un cliente y luego podrás asociarle mascotas.</p>
            </div>
          ) : (
            <div className="rg-list">
              {clientes.map((cliente) => {
                const mascotasCliente = mascotasAgrupadas[cliente.id] || [];

                return (
                  <article key={cliente.id} className="rg-record">
                    <div className="rg-record-header">
                      <h2>{cliente.nombre}</h2>
                      <span>{cliente.cedula}</span>
                    </div>

                    <div className="rg-record-grid">
                      <div className="rg-record-block">
                        <h3>Datos del cliente</h3>
                        <p><strong>Dirección:</strong> {cliente.direccion || "No registrada"}</p>
                        <p><strong>Correo:</strong> {cliente.correo || "No registrado"}</p>
                        <p><strong>Teléfono:</strong> {cliente.telefono || "No registrado"}</p>
                        <p><strong>Teléfono secundario:</strong> {cliente.telefono2 || "No registrado"}</p>
                      </div>

                      <div className="rg-record-block">
                        <h3>Mascotas asociadas</h3>

                        {mascotasCliente.length === 0 ? (
                          <p className="rg-no-pets">
                            Este cliente aún no tiene mascotas registradas.
                          </p>
                        ) : (
                          <div className="rg-pets">
                            {mascotasCliente.map((mascota) => (
                              <div key={mascota.id} className="rg-pet-card">
                                <p><strong>Nombre:</strong> {mascota.nombre}</p>
                                <p><strong>Edad:</strong> {mascota.edad}</p>
                                <p><strong>Raza:</strong> {mascota.raza}</p>
                                <p><strong>Sexo:</strong> {mascota.sexo}</p>
                                <p><strong>Peso:</strong> {mascota.peso}</p>
                                <p>
                                  <strong>Observaciones:</strong>{" "}
                                  {mascota.observaciones || "Sin observaciones"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="rg-back-menu-container">
          <button
            type="button"
            className="rg-back-menu"
            onClick={() => navigate("/menu")}
          >
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}