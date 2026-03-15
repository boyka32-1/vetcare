import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./historial.css";

export default function HistorialClinico() {
  const navigate = useNavigate();

  const [mascotasResumen, setMascotasResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadResumen = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("http://localhost:5000/api/historial-clinico/resumen");
        const raw = await res.text();

        let data = [];
        try {
          data = raw ? JSON.parse(raw) : [];
        } catch {
          throw new Error("Invalid JSON while loading clinical history summary.");
        }

        if (!res.ok) {
          throw new Error(data.message || "Could not load clinical history summary.");
        }

        const normalized = Array.isArray(data)
          ? data.map((item, index) => ({
              mascotaId:
                item.mascotaId ??
                item.mascota_id ??
                item.idMascota ??
                item.id ??
                item._id ??
                `pet-${index}`,
              nombre: item.nombre ?? item.mascotaNombre ?? item.Nombre ?? "No name",
              raza: item.raza ?? item.Raza ?? "No breed",
              edad: item.edad ?? item.Edad ?? "No age",
              clienteNombre:
                item.clienteNombre ??
                item.nombreCliente ??
                item.ownerName ??
                item.dueno ??
                item.dueño ??
                "No owner",
              consultasTotal:
                Number(
                  item.consultasTotal ??
                    item.totalConsultas ??
                    item.total_consultas ??
                    item.consultas ??
                    0
                ) || 0,
              ultimaConsulta:
                item.ultimaConsulta ??
                item.ultima_consulta ??
                item.lastConsulta ??
                item.fechaUltimaConsulta ??
                "",
            }))
          : [];

        setMascotasResumen(normalized);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load clinical history.");
      } finally {
        setLoading(false);
      }
    };

    loadResumen();
  }, []);

  const filteredMascotas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mascotasResumen;

    return mascotasResumen.filter((pet) => {
      return (
        String(pet.nombre).toLowerCase().includes(term) ||
        String(pet.raza).toLowerCase().includes(term) ||
        String(pet.edad).toLowerCase().includes(term) ||
        String(pet.clienteNombre).toLowerCase().includes(term)
      );
    });
  }, [mascotasResumen, search]);

  const totalConsultas = useMemo(() => {
    return mascotasResumen.reduce((acc, item) => acc + (item.consultasTotal || 0), 0);
  }, [mascotasResumen]);

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
      "hc-pet-avatar--mint",
      "hc-pet-avatar--blue",
      "hc-pet-avatar--purple",
      "hc-pet-avatar--orange",
      "hc-pet-avatar--gold",
    ];
    return variants[index % variants.length];
  };

  return (
    <div className="hc-page">
      <div className="hc-container">
        <header className="hc-hero">
          <button
            type="button"
            className="hc-hero-back"
            onClick={() => navigate("/menu")}
          >
            <span className="hc-hero-back-arrow">←</span>
            <span>Back</span>
          </button>

          <div className="hc-hero-copy">
            <h1>Historial Clínico</h1>
            <p>Expedientes por paciente</p>
          </div>

          <div className="hc-hero-stats">
            <strong>{totalConsultas}</strong>
            <span>consultas totales</span>
          </div>
        </header>

        <div className="hc-toolbar">
          <div className="hc-search-wrap">
            <span className="hc-search-icon">⌕</span>
            <input
              type="text"
              className="hc-search"
              placeholder="Buscar por paciente, dueño, raza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="hc-results">
            {filteredMascotas.length} paciente{filteredMascotas.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="hc-state-card">Loading clinical history...</div>
        ) : error ? (
          <div className="hc-state-card hc-state-card--error">{error}</div>
        ) : filteredMascotas.length === 0 ? (
          <div className="hc-state-card">No patients found.</div>
        ) : (
          <div className="hc-list">
            {filteredMascotas.map((pet, index) => (
              <button
                type="button"
                key={pet.mascotaId}
                className="hc-pet-row"
                onClick={() => navigate(`/historial-clinico/${pet.mascotaId}`)}
              >
                <div className="hc-pet-left">
                  <div className={`hc-pet-avatar ${avatarClassByIndex(index)}`}>
                    {getInitials(pet.nombre)}
                  </div>

                  <div className="hc-pet-main">
                    <h2>{pet.nombre}</h2>
                    <p>
                      {pet.raza || "No breed"} · {pet.edad || "No age"} · {pet.clienteNombre || "No owner"}
                    </p>
                  </div>
                </div>

                <div className="hc-pet-right">
                  <span className="hc-pill">
                    {pet.consultasTotal} consulta{pet.consultasTotal !== 1 ? "s" : ""}
                  </span>

                  <span className="hc-last-date">{formatDate(pet.ultimaConsulta)}</span>

                  <span className="hc-chevron">﹀</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}