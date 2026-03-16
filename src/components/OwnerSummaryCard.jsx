export default function OwnerSummaryCard({ cliente }) {
  if (!cliente) return null;

  return (
    <div className="hc-card">
      <h2 className="hc-card-title">Owner Information</h2>

      <div className="hc-info-list">
        <p><strong>Name:</strong> {cliente.nombre || "Not registered"}</p>
        <p><strong>Phone:</strong> {cliente.telefono || "Not registered"}</p>
        <p><strong>Email:</strong> {cliente.correo || "Not registered"}</p>
        <p><strong>Address:</strong> {cliente.direccion || "Not registered"}</p>
      </div>
    </div>
  );
}