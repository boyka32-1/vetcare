import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./registro.css";

export default function Registro() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

        const normalizedClientes = Array.isArray(clientesData)
          ? clientesData.map((cliente) => ({
              id:
                cliente.id ??
                cliente.Id ??
                cliente.ID ??
                cliente.clienteId ??
                cliente.ClienteId ??
                cliente._id ??
                "",
              nombre:
                cliente.nombre ??
                cliente.Nombre ??
                cliente.nombreCompleto ??
                cliente.NombreCompleto ??
                "",
              cedula:
                cliente.cedula ??
                cliente.Cedula ??
                cliente.cedulaCliente ??
                "",
              direccion:
                cliente.direccion ??
                cliente.Direccion ??
                "",
              correo:
                cliente.correo ??
                cliente.Correo ??
                cliente.email ??
                cliente.Email ??
                "",
              telefono:
                cliente.telefono ??
                cliente.Telefono ??
                cliente.tel ??
                "",
              telefono2:
                cliente.telefono2 ??
                cliente.Telefono2 ??
                cliente.tel2 ??
                "",
            }))
          : [];

        const normalizedMascotas = Array.isArray(mascotasData)
          ? mascotasData.map((mascota) => ({
              id:
                mascota.id ??
                mascota.Id ??
                mascota.ID ??
                mascota.mascotaId ??
                mascota.MascotaId ??
                mascota._id ??
                "",
              clienteId:
                mascota.clienteId ??
                mascota.ClienteId ??
                mascota.client_id ??
                mascota.cliente_id ??
                mascota.idCliente ??
                mascota.IdCliente ??
                mascota.ownerId ??
                "",
              nombre:
                mascota.nombre ??
                mascota.Nombre ??
                mascota.name ??
                mascota.Name ??
                "",
              edad:
                mascota.edad ??
                mascota.Edad ??
                mascota.age_years ??
                mascota.age ??
                "",
              raza:
                mascota.raza ??
                mascota.Raza ??
                mascota.breed ??
                mascota.Breed ??
                "",
              sexo:
                mascota.sexo ??
                mascota.Sexo ??
                mascota.sex ??
                mascota.Sex ??
                "",
              peso:
                mascota.peso ??
                mascota.Peso ??
                mascota.weight_kg ??
                mascota.weight ??
                "",
              observaciones:
                mascota.observaciones ??
                mascota.Observaciones ??
                mascota.notes ??
                mascota.Notes ??
                "",
            }))
          : [];

        setClientes(normalizedClientes);
        setMascotas(normalizedMascotas);
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
      const key = String(mascota.clienteId ?? "");
      if (!mapa[key]) {
        mapa[key] = [];
      }
      mapa[key].push(mascota);
    }

    return mapa;
  }, [mascotas]);

  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return clientes;

    return clientes.filter((cliente) => {
      const mascotasCliente = mascotasAgrupadas[String(cliente.id)] || [];

      const clienteMatch =
        String(cliente.nombre ?? "").toLowerCase().includes(term) ||
        String(cliente.cedula ?? "").toLowerCase().includes(term) ||
        String(cliente.direccion ?? "").toLowerCase().includes(term) ||
        String(cliente.correo ?? "").toLowerCase().includes(term) ||
        String(cliente.telefono ?? "").toLowerCase().includes(term) ||
        String(cliente.telefono2 ?? "").toLowerCase().includes(term);

      const mascotaMatch = mascotasCliente.some((mascota) => {
        return (
          String(mascota.nombre ?? "").toLowerCase().includes(term) ||
          String(mascota.edad ?? "").toLowerCase().includes(term) ||
          String(mascota.raza ?? "").toLowerCase().includes(term) ||
          String(mascota.sexo ?? "").toLowerCase().includes(term) ||
          String(mascota.peso ?? "").toLowerCase().includes(term) ||
          String(mascota.observaciones ?? "").toLowerCase().includes(term)
        );
      });

      return clienteMatch || mascotaMatch;
    });
  }, [clientes, mascotasAgrupadas, search]);

  return (
    <div className="rg-body">
      <div className="rg-card">
        <div className="rg-topbar">
          <button
            className="rg-back"
            type="button"
            onClick={() => navigate("/menu")}
          >
            ← Back
          </button>

          <div className="rg-title">
            <h1>Registro</h1>
            <p>Clientes y mascotas registrados</p>
          </div>
        </div>

        <div className="rg-list-wrap">
          {loading ? (
            <div className="rg-empty">
              <h2>Loading records...</h2>
            </div>
          ) : error ? (
            <div className="rg-empty">
              <h2>Load error</h2>
              <p>{error}</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="rg-empty">
              <h2>No hay clientes registrados</h2>
              <p>Register a client first, then you can associate pets.</p>
            </div>
          ) : (
            <>
              <div className="rg-toolbar">
                <div className="rg-search">
                  <input
                    type="text"
                    placeholder="Buscar por cliente, mascota, teléfono, ID, raza..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="rg-results-count">
                  {clientesFiltrados.length} result
                  {clientesFiltrados.length !== 1 ? "s" : ""}
                </div>
              </div>

              {clientesFiltrados.length === 0 ? (
                <div className="rg-empty">
                  <h2>No hay coincidencias</h2>
                  <p>Intenta con otro término de búsqueda.</p>
                </div>
              ) : (
                <div className="rg-list">
                  {clientesFiltrados.map((cliente) => {
                    const mascotasCliente =
                      mascotasAgrupadas[String(cliente.id)] || [];

                    return (
                      <article key={cliente.id} className="rg-record">
                        <div className="rg-record-header">
                          <h2>{cliente.nombre || "Unnamed client"}</h2>
                          <span>{cliente.cedula || "No ID"}</span>
                        </div>

                        <div className="rg-record-grid">
                          <div className="rg-record-block">
                            <h3>Datos del cliente</h3>
                            <p>
                              <strong>Dirección:</strong>{" "}
                              {cliente.direccion || "No registrado"}
                            </p>
                            <p>
                              <strong>Email:</strong>{" "}
                              {cliente.correo || "No registrado"}
                            </p>
                            <p>
                              <strong>Teléfono:</strong>{" "}
                              {cliente.telefono || "No registrado"}
                            </p>
                            <p>
                              <strong>Teléfono secundario:</strong>{" "}
                              {cliente.telefono2 || "No registrado"}
                            </p>
                          </div>

                          <div className="rg-record-block">
                            <h3>Mascotas asociadas</h3>

                            {mascotasCliente.length === 0 ? (
                              <p className="rg-no-pets">
                                This client does not have registered pets yet.
                              </p>
                            ) : (
                              <div className="rg-pets">
                                {mascotasCliente.map((mascota) => (
                                  <div key={mascota.id} className="rg-pet-card">
                                    <p>
                                      <strong>Nombre:</strong>{" "}
                                      {mascota.nombre || "No registrado"}
                                    </p>
                                    <p>
                                      <strong>Edad:</strong>{" "}
                                      {mascota.edad || "No registrado"}
                                    </p>
                                    <p>
                                      <strong>Raza:</strong>{" "}
                                      {mascota.raza || "No registrada"}
                                    </p>
                                    <p>
                                      <strong>Sexo:</strong>{" "}
                                      {mascota.sexo || "No registrado"}
                                    </p>
                                    <p>
                                      <strong>Peso:</strong>{" "}
                                      {mascota.peso || "No registrado"}
                                    </p>
                                    <p>
                                      <strong>Notes:</strong>{" "}
                                      {mascota.observaciones || "No notes"}
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
            </>
          )}
        </div>

        <div className="rg-back-menu-container">
          <button
            type="button"
            className="rg-back-menu"
            onClick={() => navigate("/menu")}
          >
            Devuelta al menú
          </button>
        </div>
      </div>
    </div>
  );
}