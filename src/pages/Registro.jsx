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

        // Normalize clients
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

        // Normalize pets
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
                mascota.cliente_id ??
                mascota.idCliente ??
                mascota.IdCliente ??
                mascota.ownerId ??
                "",
              nombre:
                mascota.nombre ??
                mascota.Nombre ??
                "",
              edad:
                mascota.edad ??
                mascota.Edad ??
                "",
              raza:
                mascota.raza ??
                mascota.Raza ??
                "",
              sexo:
                mascota.sexo ??
                mascota.Sexo ??
                "",
              peso:
                mascota.peso ??
                mascota.Peso ??
                "",
              observaciones:
                mascota.observaciones ??
                mascota.Observaciones ??
                "",
            }))
          : [];

        console.log("Clientes normalized:", normalizedClientes);
        console.log("Mascotas normalized:", normalizedMascotas);

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
            <h1>Registry</h1>
            <p>Registered clients and pets</p>
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
              <h2>No registered clients</h2>
              <p>Register a client first, then you can associate pets.</p>
            </div>
          ) : (
            <>
              <div className="rg-toolbar">
                <div className="rg-search">
                  <input
                    type="text"
                    placeholder="Search by client, pet, phone, ID, breed..."
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
                  <h2>No matches found</h2>
                  <p>Try another search term.</p>
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
                            <h3>Client data</h3>
                            <p>
                              <strong>Address:</strong>{" "}
                              {cliente.direccion || "Not registered"}
                            </p>
                            <p>
                              <strong>Email:</strong>{" "}
                              {cliente.correo || "Not registered"}
                            </p>
                            <p>
                              <strong>Phone:</strong>{" "}
                              {cliente.telefono || "Not registered"}
                            </p>
                            <p>
                              <strong>Secondary phone:</strong>{" "}
                              {cliente.telefono2 || "Not registered"}
                            </p>
                          </div>

                          <div className="rg-record-block">
                            <h3>Associated pets</h3>

                            {mascotasCliente.length === 0 ? (
                              <p className="rg-no-pets">
                                This client does not have registered pets yet.
                              </p>
                            ) : (
                              <div className="rg-pets">
                                {mascotasCliente.map((mascota) => (
                                  <div key={mascota.id} className="rg-pet-card">
                                    <p>
                                      <strong>Name:</strong>{" "}
                                      {mascota.nombre || "No name"}
                                    </p>
                                    <p>
                                      <strong>Age:</strong>{" "}
                                      {mascota.edad || "Not registered"}
                                    </p>
                                    <p>
                                      <strong>Breed:</strong>{" "}
                                      {mascota.raza || "Not registered"}
                                    </p>
                                    <p>
                                      <strong>Sex:</strong>{" "}
                                      {mascota.sexo || "Not registered"}
                                    </p>
                                    <p>
                                      <strong>Weight:</strong>{" "}
                                      {mascota.peso || "Not registered"}
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
            Back to menu
          </button>
        </div>
      </div>
    </div>
  );
}