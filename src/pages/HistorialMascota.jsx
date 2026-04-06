import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./historialMascota.css";

const API_URL = "http://localhost:5000";

const VISIT_TYPE_LABELS = {
  vac: "Vacuna",
  gen: "Examen general",
  ill: "Enfermedad",
  sur: "Cirugía",
  med: "Medicación",
  den: "Dental",
  rou: "Control rutinario",
  eme: "Emergencia",
  emb: "Embarazo",
};

function normalizeVisitTypes(tipos, tiposDetalle) {
  if (Array.isArray(tiposDetalle) && tiposDetalle.length > 0) {
    return tiposDetalle
      .map((item) => item?.nombre || VISIT_TYPE_LABELS[item?.codigo] || item?.codigo)
      .filter(Boolean)
      .join(", ");
  }

  if (!tipos) return "Sin tipo";

  let parsed = tipos;

  if (typeof tipos === "string") {
    try {
      parsed = JSON.parse(tipos);
    } catch {
      parsed = tipos;
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((type) => VISIT_TYPE_LABELS[type] || type).join(", ");
  }

  return VISIT_TYPE_LABELS[parsed] || parsed;
}

export default function HistorialMascota() {
  const navigate = useNavigate();
  const { mascotaId } = useParams();

  const [consultas, setConsultas] = useState([]);
  const [mascotaInfo, setMascotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarHistorial = async () => {
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

        // 1) Cargar lista de mascotas para sacar información básica
        const mascotasRes = await fetch(`${API_URL}/api/mascotas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (mascotasRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const mascotasRaw = await mascotasRes.text();

        let mascotasData = [];
        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar mascotas.");
        }

        if (!mascotasRes.ok) {
          throw new Error(
            mascotasData?.message || "No se pudieron cargar las mascotas."
          );
        }

        if (!Array.isArray(mascotasData)) {
          throw new Error("La respuesta de mascotas no es un arreglo.");
        }

        const mascota =
          mascotasData.find(
            (item) =>
              String(
                item.id ??
                  item.Id ??
                  item.ID ??
                  item.mascotaId ??
                  item.MascotaId ??
                  item._id ??
                  ""
              ) === String(mascotaId)
          ) || null;

        setMascotaInfo(mascota);

        // 2) Cargar historial clínico de la mascota
        const historialRes = await fetch(
          `${API_URL}/api/mascotas/${mascotaId}/consultas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (historialRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const historialRaw = await historialRes.text();

        let historialData = [];
        try {
          historialData = historialRaw ? JSON.parse(historialRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar historial clínico.");
        }

        if (!historialRes.ok) {
          throw new Error(
            historialData?.message || "No se pudo cargar el historial clínico."
          );
        }

        if (!Array.isArray(historialData)) {
          throw new Error("La respuesta del historial clínico no es un arreglo.");
        }

        setConsultas(historialData);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el historial clínico.");
      } finally {
        setLoading(false);
      }
    };

    if (mascotaId) {
      cargarHistorial();
    }
  }, [mascotaId, navigate]);

  const formatDate = (date) => {
    if (!date) return "Sin fecha";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mascotaNombre =
    mascotaInfo?.name ??
    mascotaInfo?.nombre ??
    "Sin nombre";

  const mascotaRaza =
    mascotaInfo?.breed ??
    mascotaInfo?.raza ??
    "Sin raza";

  const mascotaEdad =
    mascotaInfo?.age_years ??
    mascotaInfo?.edad ??
    "Sin edad";

  const clienteNombre =
    `${mascotaInfo?.first_name ?? ""} ${mascotaInfo?.last_name ?? ""}`.trim() ||
    mascotaInfo?.clienteNombre ||
    "Sin dueño";

  return (
    <div className="hcd-page">
      <div className="hcd-container">
        <header className="hcd-header">
          <button
            type="button"
            className="hcd-back-btn"
            onClick={() => navigate("/historial")}
          >
            ← Back
          </button>

          <div className="hcd-header-copy">
            <h1>Historial de Mascota</h1>
            <p>Detalle clínico del paciente</p>
          </div>
        </header>

        {loading ? (
          <div className="hcd-state-card">Cargando historial clínico...</div>
        ) : error ? (
          <div className="hcd-state-card hcd-state-card--error">{error}</div>
        ) : (
          <>
            <section className="hcd-summary-grid">
              <article className="hcd-card">
                <h2>Mascota</h2>
                <div className="hcd-info-list">
                  <p>
                    <strong>Nombre:</strong> {mascotaNombre}
                  </p>
                  <p>
                    <strong>Raza:</strong> {mascotaRaza}
                  </p>
                  <p>
                    <strong>Edad:</strong> {mascotaEdad}
                  </p>
                </div>
              </article>

              <article className="hcd-card">
                <h2>Propietario</h2>
                <div className="hcd-info-list">
                  <p>
                    <strong>Cliente:</strong> {clienteNombre}
                  </p>
                  <p>
                    <strong>Total consultas:</strong> {consultas.length}
                  </p>
                </div>
              </article>
            </section>

            <section className="hcd-card">
              <div className="hcd-section-head">
                <h2>Consultas clínicas</h2>
                <span>
                  {consultas.length} consulta{consultas.length !== 1 ? "s" : ""}
                </span>
              </div>

              {consultas.length === 0 ? (
                <p className="hcd-empty-text">
                  No se encontró historial clínico para esta mascota.
                </p>
              ) : (
                <div className="hcd-consultation-list">
                  {consultas.map((consulta) => (
                    <article key={consulta.id} className="hcd-consultation-card">
                      <div className="hcd-consultation-top">
                        <div>
                          <h3>{consulta.reason || "Sin motivo"}</h3>
                          <p>{formatDate(consulta.visit_at)}</p>
                        </div>

                        <div className="hcd-badges">
                          <span className="hcd-badge">
                            {consulta.doctor || "Sin doctor"}
                          </span>
                          <span className="hcd-badge hcd-badge--soft">
                            {normalizeVisitTypes(
                              consulta.tipos_consulta,
                              consulta.tipos_consulta_detalle
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="hcd-consultation-body">
                        <p>
                          <strong>Diagnóstico:</strong>{" "}
                          {consulta.diagnosis || "Sin diagnóstico"}
                        </p>
                        <p>
                          <strong>Tratamiento:</strong>{" "}
                          {consulta.treatment || "Sin tratamiento"}
                        </p>
                        <p>
                          <strong>Notas:</strong> {consulta.notes || "Sin notas"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}