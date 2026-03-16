export default function PetSelector({
  mascotas = [],
  selectedMascotaId = "",
  onChange,
  loading = false,
}) {
  return (
    <div className="hc-card">
      <h2 className="hc-card-title">Select Patient</h2>

      <div className="hc-field">
        <label className="hc-label">Pet</label>
        <select
          className="hc-select"
          value={selectedMascotaId}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {loading ? "Loading pets..." : "— Select a pet —"}
          </option>

          {mascotas.map((mascota) => (
            <option key={mascota.id} value={mascota.id}>
              {mascota.nombre}
              {mascota.raza ? ` — ${mascota.raza}` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}