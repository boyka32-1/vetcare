import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./registroCliente.css";

const API_URL = "http://localhost:5000";

export default function RegistroCliente() {
  const navigate = useNavigate();
  const { clienteId } = useParams();

  const [clienteInfo, setClienteInfo] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarRegistroCliente = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const [clienteRes, mascotasRes] = await Promise.all([
          fetch(`${API_URL}/api/clientes?id=${clienteId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/mascotas?clienteId=${clienteId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (clienteRes.status === 401 || mascotasRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const clienteRaw = await clienteRes.text();
        const mascotasRaw = await mascotasRes.text();

        let clienteData = [];
        let mascotasData = [];

        try {
          clienteData = clienteRaw ? JSON.parse(clienteRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar cliente.");
        }

        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar mascotas.");
        }

        if (!clienteRes.ok) {
          throw new Error(clienteData?.message || "No se pudo cargar el cliente.");
        }

        if (!mascotasRes.ok) {
          throw new Error(mascotasData?.message || "No se pudieron cargar las mascotas.");
        }

        if (!Array.isArray(clienteData) || clienteData.length === 0) {
          throw new Error("Cliente no encontrado.");
        }

        const cliente = clienteData[0];

        const normalizedCliente = {
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
            "Sin nombre",
          cedula:
            cliente.cedula ??
            cliente.Cedula ??
            cliente.cedulaCliente ??
            "Sin cédula",
          direccion:
            cliente.direccion ??
            cliente.Direccion ??
            "No registrado",
          correo:
            cliente.correo ??
            cliente.Correo ??
            cliente.email ??
            cliente.Email ??
            "No registrado",
          telefono:
            cliente.telefono ??
            cliente.Telefono ??
            cliente.tel ??
            "—",
          telefono2:
            cliente.telefono2 ??
            cliente.Telefono2 ??
            cliente.tel2 ??
            "—",
        };

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
              nombre:
                mascota.nombre ??
                mascota.Nombre ??
                mascota.name ??
                mascota.Name ??
                "Sin nombre",
              raza:
                mascota.raza ??
                mascota.Raza ??
                mascota.breed ??
                mascota.Breed ??
                "Sin raza",
              edad:
                mascota.edad ??
                mascota.Edad ??
                mascota.age_years ??
                mascota.age ??
                "Sin edad",
              sexo:
                mascota.sexo ??
                mascota.Sexo ??
                mascota.sex ??
                mascota.Sex ??
                "No registrado",
              peso:
                mascota.peso ??
                mascota.Peso ??
                mascota.weight_kg ??
                mascota.weight ??
                "No registrado",
              observaciones:
                mascota.observaciones ??
                mascota.Observaciones ??
                mascota.notes ??
                mascota.Notes ??
                "Sin observaciones",
            }))
          : [];

        setClienteInfo(normalizedCliente);
        setMascotas(normalizedMascotas);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el registro del cliente.");
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      cargarRegistroCliente();
    }
  }, [clienteId, navigate]);

  const totalMascotas = useMemo(() => mascotas.length, [mascotas]);

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const avatarClassByIndex = (index) => {
    const variants = [
      "rcc-pet-avatar--mint",
      "rcc-pet-avatar--blue",
      "rcc-pet-avatar--purple",
      "rcc-pet-avatar--orange",
      "rcc-pet-avatar--gold",
    ];
    return variants[index % variants.length];
  };

  const renderMascotaRow = (mascota, index) => (
    <button
      type="button"
      key={mascota.id}
      className="rcc-pet-row"
      onClick={() => navigate(`/historial-clinico/${mascota.id}`)}
    >
      <div className="rcc-pet-left">
        <div className={`rcc-pet-avatar ${avatarClassByIndex(index)}`}>
          {getInitials(mascota.nombre)}
        </div>

        <div className="rcc-pet-main">
          <h2>{mascota.nombre}</h2>
          <p>
            {mascota.raza || "Sin raza"} · {mascota.edad || "Sin edad"} ·{" "}
            {mascota.sexo || "Sin sexo"}
          </p>
        </div>
      </div>

      <div className="rcc-pet-right">
        <span className="rcc-pill">{mascota.peso || "Sin peso"}</span>
        <span className="rcc-pill rcc-pill--soft">
          {mascota.observaciones || "Sin observaciones"}
        </span>
        <span className="rcc-chevron-btn">›</span>
      </div>
    </button>
  );

  return (
    <div className="rcc-page">
      <div className="rcc-container">
        <header className="rcc-header">
          <button
            type="button"
            className="rcc-back-btn"
            onClick={() => navigate("/registro")}
          >
            ← volver
          </button>

          <div className="rcc-header-copy">
            <h1>Registro de cliente</h1>
            <p>Detalle del cliente y sus mascotas</p>
          </div>
        </header>

        {loading ? (
          <div className="rcc-state-card">Cargando registro del cliente...</div>
        ) : error ? (
          <div className="rcc-state-card rcc-state-card--error">{error}</div>
        ) : (
          <>
            <section className="rcc-summary-grid">
              <article className="rcc-card">
                <h2>CLIENTE</h2>

                <div className="rcc-client-main">
                  <div className="rcc-client-avatar">
                    {getInitials(clienteInfo?.nombre || "")}
                  </div>

                  <div className="rcc-client-main-copy">
                    <strong>{clienteInfo?.nombre}</strong>
                    <span>{clienteInfo?.cedula}</span>
                  </div>
                </div>
              </article>

              <article className="rcc-card">
                <h2>CONTACTO</h2>

                <div className="rcc-owner-lines">
                  <div className="rcc-owner-line">
                    <span>Email</span>
                    <strong>{clienteInfo?.correo || "—"}</strong>
                  </div>

                  <div className="rcc-owner-line">
                    <span>Teléfono</span>
                    <strong>{clienteInfo?.telefono || "—"}</strong>
                  </div>
                </div>

                <div className="rcc-mini-stats">
                  <div className="rcc-mini-stat">
                    <strong>{totalMascotas}</strong>
                    <span>mascotas</span>
                  </div>

                  <div className="rcc-mini-stat">
                    <strong>{clienteInfo?.telefono2 || "—"}</strong>
                    <span>tel. secundario</span>
                  </div>
                </div>
              </article>
            </section>

            <section className="rcc-detail-section">
              <div className="rcc-section-head">
                <h3>Mascotas asociadas</h3>
                <span className="rcc-count-pill">
                  {totalMascotas} mascota{totalMascotas !== 1 ? "s" : ""}
                </span>
              </div>

              {mascotas.length === 0 ? (
                <div className="rcc-state-card">
                  Este cliente no tiene mascotas registradas.
                </div>
              ) : (
                <div className="rcc-list">
                  {mascotas.map((mascota, index) =>
                    renderMascotaRow(mascota, index)
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}