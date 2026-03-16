export default function ConsultationCard({ consulta }) {
  return (
    <article className="hc-consultation-card">
      <div className="hc-consultation-header">
        <div>
          <h3 className="hc-consultation-date">
            {consulta.fecha || "No date"}
            {consulta.hora ? ` · ${consulta.hora}` : ""}
          </h3>
          <p className="hc-consultation-doctor">
            {consulta.doctor || "No doctor registered"}
          </p>
        </div>

        <div className="hc-badges">
          <span className="hc-badge">{consulta.estado || "No status"}</span>
          <span className="hc-badge hc-badge-soft">
            {consulta.gravedad || "No severity"}
          </span>
        </div>
      </div>

      <div className="hc-consultation-body">
        <p><strong>Reason:</strong> {consulta.motivo || "Not registered"}</p>
        <p><strong>Diagnosis:</strong> {consulta.diagnostico || "Not registered"}</p>
        <p><strong>Observations:</strong> {consulta.observaciones || "Not registered"}</p>
      </div>
    </article>
  );
}