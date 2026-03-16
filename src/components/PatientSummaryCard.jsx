export default function PatientSummaryCard({ mascota }) {
  if (!mascota) return null;

  return (
    <div className="hc-card">
      <h2 className="hc-card-title">Patient Information</h2>

      <div className="hc-info-list">
        <p><strong>Name:</strong> {mascota.nombre || "Not registered"}</p>
        <p><strong>Breed:</strong> {mascota.raza || "Not registered"}</p>
        <p><strong>Age:</strong> {mascota.edad || "Not registered"}</p>
        <p><strong>Sex:</strong> {mascota.sexo || "Not registered"}</p>
        <p><strong>Weight:</strong> {mascota.peso || "Not registered"}</p>
      </div>
    </div>
  );
}