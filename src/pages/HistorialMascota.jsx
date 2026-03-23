import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./historialMascota.css";

const API_URL = "http://localhost:5000";

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

        // 1) Cargar lista de mascotas para sacar información básica
        const mascotasRes = await fetch(`${API_URL}/api/mascotas`);
        const mascotasRaw = await mascotasRes.text();

        let mascotasData = [];
        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading pets.");
        }

        if (!mascotasRes.ok) {
          throw new Error("Could not load pets.");
        }

        if (!Array.isArray(mascotasData)) {
          throw new Error("Pets response is not an array.");
        }

        const mascota = mascotasData.find((item) => item.id === mascotaId) || null;
        setMascotaInfo(mascota);

        // 2) Cargar historial clínico de la mascota
        const historialRes = await fetch(
          `${API_URL}/api/mascotas/${mascotaId}/consultas`
        );
        const historialRaw = await historialRes.text();

        let historialData = [];
        try {
          historialData = historialRaw ? JSON.parse(historialRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading pet clinical history.");
        }

        if (!historialRes.ok) {
          throw new Error(
            historialData.message || "Could not load pet clinical history."
          );
        }

        if (!Array.isArray(historialData)) {
          throw new Error("Clinical history response is not an array.");
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
  }, [mascotaId]);

  const formatDate = (date) => {
    if (!date) return "No date";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mascotaNombre = mascotaInfo?.name || "No name";
  const mascotaRaza = mascotaInfo?.breed || "No breed";
  const mascotaEdad = mascotaInfo?.age_years || "No age";
  const clienteNombre =
    `${mascotaInfo?.first_name || ""} ${mascotaInfo?.last_name || ""}`.trim() ||
    "No owner";
const VISIT_TYPE_LABELS = {
  vac: "Vacuna",
  gen: "Examen general",
  ill: "Enfermedad",
  sur: "Cirugía",
  med: "Medicación",
  den: "Dental",
  rou: "Control rutinario",
  eme: "Emergencia",
};

const formatConsultaTypes = (tipos) => {
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
};
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
          <div className="hcd-state-card">Loading clinical history...</div>
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
                  No clinical history found for this pet.
                </p>
              ) : (
                <div className="hcd-consultation-list">
                  {consultas.map((consulta) => (
                    <article key={consulta.id} className="hcd-consultation-card">
                      <div className="hcd-consultation-top">
                        <div>
                          <h3>{consulta.reason || "No reason"}</h3>
                          <p>{formatDate(consulta.visit_at)}</p>
                        </div>

                        <div className="hcd-badges">
                          <span className="hcd-badge">
                            {consulta.doctor || "No doctor"}
                          </span>
                          <span className="hcd-badge hcd-badge--soft">
                          {formatConsultaTypes(consulta.tipos_consulta)}
                        </span>
                        </div>
                      </div>

                      <div className="hcd-consultation-body">
                        <p>
                          <strong>Diagnosis:</strong>{" "}
                          {consulta.diagnosis || "No diagnosis"}
                        </p>
                        <p>
                          <strong>Treatment:</strong>{" "}
                          {consulta.treatment || "No treatment"}
                        </p>
                        <p>
                          <strong>Notes:</strong> {consulta.notes || "No notes"}
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