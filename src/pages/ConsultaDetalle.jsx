import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./consultaDetalle.css";

const API_URL = "http://localhost:5000";

export default function ConsultaDetalle() {
  const { consultaId } = useParams();
  const navigate = useNavigate();

  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState("");

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadConsulta = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/consultas/${consultaId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const raw = await res.text();
        console.log("STATUS:", res.status);
        console.log("RAW RESPONSE:", raw);

        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error(`Server did not return valid JSON. Status: ${res.status}`);
        }

        if (!res.ok) {
          throw new Error(data.message || "Could not load consulta.");
        }

        setConsulta(data);
      } catch (err) {
        setError(err.message || "Error loading consulta.");
      }
    };

    loadConsulta();
  }, [consultaId]);

  if (error) {
    return (
      <div className="cd-page">
        <div className="cd-container">
          <div className="cd-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="cd-page">
        <div className="cd-container">
          <div className="cd-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <div className="cd-container">
        <div className="cd-header">
  <div className="cd-header-side cd-header-left">
     <button
          type="button"
          className="cd-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>
  </div>

      <div className="cd-header-copy">
        <h1>{consulta.reason || "Consulta"}</h1>
        <p>{consulta.doctor || "Sin doctor"}</p>
      </div>

      <div className="cd-header-side cd-header-right">
        <button
      type="button"
      className="cd-edit-btn"
      onClick={() => navigate(`/consulta/${item.consultaId}?edit=1`)}
    >
      Editar 🖊
    </button>
      </div>
    </div>

        <div className="cd-card">
          <h3 className="cd-card-title">Información</h3>

          <div className="cd-info-grid">
            <div className="cd-info-row">
              <span>Doctor</span>
              <strong>{consulta.doctor || "Sin doctor"}</strong>
            </div>

            <div className="cd-info-row">
              <span>Fecha</span>
              <strong>{formatDate(consulta.visit_at)}</strong>
            </div>

            <div className="cd-info-row">
              <span>Estado</span>
              <strong>{consulta.estado || "Sin estado"}</strong>
            </div>

            <div className="cd-info-row">
              <span>Gravedad</span>
              <strong>{consulta.gravedad || "Sin gravedad"}</strong>
            </div>
          </div>
        </div>

        {consulta.diagnosis && (
          <div className="cd-card">
            <h3 className="cd-card-title">Diagnóstico</h3>
            <p className="cd-text">{consulta.diagnosis}</p>
          </div>
        )}

        {consulta.treatment && (
          <div className="cd-card">
            <h3 className="cd-card-title">Tratamiento</h3>
            <p className="cd-text">{consulta.treatment}</p>
          </div>
        )}

        {consulta.notes && (
          <div className="cd-card">
            <h3 className="cd-card-title">Notas</h3>
            <p className="cd-text">{consulta.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}