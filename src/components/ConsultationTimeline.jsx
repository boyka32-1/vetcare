import ConsultationCard from "./ConsultationCard";

export default function ConsultationTimeline({ consultas = [] }) {
  return (
    <div className="hc-card">
      <h2 className="hc-card-title">Consultations</h2>

      {consultas.length === 0 ? (
        <p className="hc-empty-text">
          This patient does not have consultations yet.
        </p>
      ) : (
        <div className="hc-timeline">
          {consultas.map((consulta) => (
            <ConsultationCard key={consulta.id} consulta={consulta} />
          ))}
        </div>
      )}
    </div>
  );
}