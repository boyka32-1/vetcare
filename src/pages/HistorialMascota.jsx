import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./historialMascota.css";

export default function HistorialMascota() {
  const navigate = useNavigate();
  const { mascotaId } = useParams();

  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`http://localhost:5000/api/mascotas/${mascotaId}/consultas`);
        const raw = await res.text();

        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error("Invalid JSON while loading pet clinical history.");
        }

        if (!res.ok) {
          throw new Error(data?.message || "Could not load pet clinical history.");
        }

        const normalized = {
          mascota: {
            id: data?.mascota?.id ?? "",
            nombre: data?.mascota?.nombre ?? "No name",
            raza: data?.mascota?.raza ?? "No breed",
            edad: data?.mascota?.edad ?? "No age",
            sexo: data?.mascota?.sexo ?? "No sex",
            peso: data?.mascota?.peso ?? "No weight",
          },
          cliente: {
            id: data?.cliente?.id ?? "",
            nombre: data?.cliente?.nombre ?? "No owner",
            telefono: data?.cliente?.telefono ?? "No phone",
            correo: data?.cliente?.correo ?? "No email",
            direccion: data?.cliente?.direccion ?? "No address",
          },
          consultas: Array.isArray(data?.consultas)
            ? data.consultas.map((consulta, index) => ({
                id: consulta.id ?? consulta.consultaId ?? `consulta-${index}`,
                fecha: consulta.fecha ?? "",
                hora: consulta.hora ?? "",
                doctor: consulta.doctor ?? consulta.doctor_nombre ?? "No doctor",
                motivo: consulta.motivo ?? "No reason",
                diagnostico: consulta.diagnostico ?? "No diagnosis",
                observaciones: consulta.observaciones ?? "No observations",
                estado: consulta.estado ?? "No status",
                gravedad: consulta.gravedad ?? "No severity",
              }))
            : [],
        };

        setHistorial(normalized);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load clinical history.");
      } finally {
        setLoading(false);
      }
    };

    if (mascotaId) {
      loadHistorial();
    }
  }, [mascotaId]);

  const formatDate = (date) => {
    if (!date) return "No date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="hcd-page">
      <div className="hcd-container">
        <header className="hcd-header">
          <button
            type="button"
            className="hcd-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="hcd-header-copy">
            <h1>Historial Clínico</h1>
            <p>Consulta el historial completo de la mascota</p>
          </div>
        </header>

        {loading ? (
          <div className="hcd-state-card">Loading pet clinical history...</div>
        ) : error ? (
          <div className="hcd-state-card hcd-state-card--error">{error}</div>
        ) : !historial ? (
          <div className="hcd-state-card">No data available.</div>
        ) : (
          <>
            <div className="hcd-summary-grid">
              <section className="hcd-card">
                <h2>Paciente</h2>
                <div className="hcd-info-list">
                  <p><strong>Nombre:</strong> {historial.mascota.nombre}</p>
                  <p><strong>Raza:</strong> {historial.mascota.raza}</p>
                  <p><strong>Edad:</strong> {historial.mascota.edad}</p>
                  <p><strong>Sexo:</strong> {historial.mascota.sexo}</p>
                  <p><strong>Peso:</strong> {historial.mascota.peso}</p>
                </div>
              </section>

              <section className="hcd-card">
                <h2>Propietario</h2>
                <div className="hcd-info-list">
                  <p><strong>Nombre:</strong> {historial.cliente.nombre}</p>
                  <p><strong>Teléfono:</strong> {historial.cliente.telefono}</p>
                  <p><strong>Email:</strong> {historial.cliente.correo}</p>
                  <p><strong>Dirección:</strong> {historial.cliente.direccion}</p>
                </div>
              </section>
            </div>

            <section className="hcd-card">
              <div className="hcd-section-head">
                <h2>Consultas</h2>
                <span>
                  {historial.consultas.length} consulta
                  {historial.consultas.length !== 1 ? "s" : ""}
                </span>
              </div>

              {historial.consultas.length === 0 ? (
                <p className="hcd-empty-text">This pet does not have consultations yet.</p>
              ) : (
                <div className="hcd-consultation-list">
                  {historial.consultas.map((consulta) => (
                    <article key={consulta.id} className="hcd-consultation-card">
                      <div className="hcd-consultation-top">
                        <div>
                          <h3>
                            {formatDate(consulta.fecha)}
                            {consulta.hora ? ` · ${consulta.hora}` : ""}
                          </h3>
                          <p>{consulta.doctor}</p>
                        </div>

                        <div className="hcd-badges">
                          <span className="hcd-badge">{consulta.estado}</span>
                          <span className="hcd-badge hcd-badge--soft">{consulta.gravedad}</span>
                        </div>
                      </div>

                      <div className="hcd-consultation-body">
                        <p><strong>Motivo:</strong> {consulta.motivo}</p>
                        <p><strong>Diagnóstico:</strong> {consulta.diagnostico}</p>
                        <p><strong>Observaciones:</strong> {consulta.observaciones}</p>
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