import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./alertas.module.css";

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeDateOnly(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function getAlertType(fecha) {
  if (!fecha) return "upcoming";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = normalizeDateOnly(fecha);
  if (!target) return "upcoming";

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return "upcoming";
}

function getAlertLabel(type) {
  switch (type) {
    case "overdue":
      return "Atrasada";
    case "today":
      return "Hoy";
    case "tomorrow":
      return "Mañana";
    default:
      return "Próxima";
  }
}

export default function Alertas() {
  const navigate = useNavigate();

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [stats, setStats] = useState({
    overdue: 0,
    today: 0,
    tomorrow: 0,
    upcoming: 0,
  });

  useEffect(() => {
    const loadAlertas = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/api/alertas");
        const raw = await response.text();

        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = {};
        }

        if (!response.ok) {
          setError(
            (data && data.message) || "No se pudieron cargar las alertas."
          );
          setAlertas([]);
          return;
        }

        const resumen = data?.resumen || {};
        const lista = Array.isArray(data?.alertas) ? data.alertas : [];

        const normalized = lista.map((item, index) => ({
          id: item?.id ?? `row-${index}`,
          fecha: item?.proxima_cita ?? item?.fecha ?? "",
          hora: item?.proxima_cita ? formatTime(item.proxima_cita) : formatTime(item.fecha),
          motivo:
            item?.motivo ??
            item?.motivo_seguimiento ??
            item?.diagnostico ??
            "",
          estado: item?.estado ?? "pendiente",
          patientId: item?.pet_id ?? "",
          patientName: item?.mascota_nombre ?? "Sin nombre",
          raza: item?.mascota_raza ?? "",
          ownerName: item?.cliente_nombre ?? "Sin dueño",
          phone: item?.cliente_telefono ?? "",
          doctorName: item?.doctor_nombre ?? "",
          categoria: item?.categoria ?? "upcoming",
          rawFechaConsulta: item?.fecha ?? "",
          rawProximaCita: item?.proxima_cita ?? "",
          gravedad: item?.gravedad ?? "",
          observaciones: item?.observaciones ?? "",
          diagnostico: item?.diagnostico ?? "",
        }));

        setAlertas(normalized);

        setStats({
          overdue: Number(resumen.atrasadas ?? 0),
          today: Number(resumen.hoy ?? 0),
          tomorrow: Number(resumen.manana ?? 0),
          upcoming: Number(resumen.proximas ?? 0),
        });
      } catch (err) {
        console.error("Error loading alertas:", err);
        setError("No se pudo conectar con el servidor.");
        setAlertas([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlertas();
  }, []);

  const filteredAlertas = useMemo(() => {
    let result = [...alertas];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter((item) => {
        return (
          String(item.patientName || "").toLowerCase().includes(q) ||
          String(item.ownerName || "").toLowerCase().includes(q) ||
          String(item.phone || "").toLowerCase().includes(q) ||
          String(item.doctorName || "").toLowerCase().includes(q) ||
          String(item.motivo || "").toLowerCase().includes(q) ||
          String(item.raza || "").toLowerCase().includes(q)
        );
      });
    }

    if (filter !== "all") {
      result = result.filter((item) => getAlertType(item.fecha) === filter);
    }

    result.sort((a, b) => {
      const aDate = new Date(a.fecha || "");
      const bDate = new Date(b.fecha || "");

      const aTime = Number.isNaN(aDate.getTime()) ? 0 : aDate.getTime();
      const bTime = Number.isNaN(bDate.getTime()) ? 0 : bDate.getTime();

      return aTime - bTime;
    });

    return result;
  }, [alertas, search, filter]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>

            <div>
              <h1 className={styles.title}>Alertas</h1>
              <p className={styles.sub}>
                Próximas citas, seguimientos y pendientes clínicos
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate("/consultas")}
          >
            + Nueva consulta
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statOverdue}`}>
            <span className={styles.statLabel}>Atrasadas</span>
            <strong className={styles.statValue}>{stats.overdue}</strong>
          </div>

          <div className={`${styles.statCard} ${styles.statToday}`}>
            <span className={styles.statLabel}>Hoy</span>
            <strong className={styles.statValue}>{stats.today}</strong>
          </div>

          <div className={`${styles.statCard} ${styles.statTomorrow}`}>
            <span className={styles.statLabel}>Mañana</span>
            <strong className={styles.statValue}>{stats.tomorrow}</strong>
          </div>

          <div className={`${styles.statCard} ${styles.statUpcoming}`}>
            <span className={styles.statLabel}>Próximas</span>
            <strong className={styles.statValue}>{stats.upcoming}</strong>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por mascota, dueño, doctor, teléfono o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.filterGroup}>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "all" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "overdue" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("overdue")}
            >
              Atrasadas
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "today" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("today")}
            >
              Hoy
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "tomorrow" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("tomorrow")}
            >
              Mañana
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "upcoming" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("upcoming")}
            >
              Próximas
            </button>
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>Cargando alertas...</div>
          ) : error ? (
            <div className={styles.errorState}>{error}</div>
          ) : filteredAlertas.length === 0 ? (
            <div className={styles.emptyState}>No hay alertas para mostrar.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Alerta</th>
                    <th>Paciente</th>
                    <th>Dueño</th>
                    <th>Doctor</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Motivo</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlertas.map((item) => {
                    const type = getAlertType(item.fecha);

                    return (
                      <tr key={item.id}>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              type === "overdue"
                                ? styles.badgeOverdue
                                : type === "today"
                                ? styles.badgeToday
                                : type === "tomorrow"
                                ? styles.badgeTomorrow
                                : styles.badgeUpcoming
                            }`}
                          >
                            {getAlertLabel(type)}
                          </span>
                        </td>

                        <td>
                          <div className={styles.patientCell}>
                            <div className={styles.avatar}>
                              {String(item.patientName || "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className={styles.patientName}>
                                {item.patientName || "Sin nombre"}
                              </div>
                              <div className={styles.patientSub}>
                                {item.raza || "Sin raza"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.ownerName}>
                            {item.ownerName || "Sin dueño"}
                          </div>
                          <div className={styles.ownerPhone}>
                            {item.phone || "—"}
                          </div>
                        </td>

                        <td>{item.doctorName || "—"}</td>
                        <td>{formatDate(item.fecha)}</td>
                        <td>{item.hora || "—"}</td>
                        <td className={styles.reasonCell}>{item.motivo || "—"}</td>

                        <td>
                          <button
                            type="button"
                            className={styles.outlineBtn}
                            onClick={() =>
                              navigate(`/consultas?patientId=${item.patientId}`)
                            }
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}