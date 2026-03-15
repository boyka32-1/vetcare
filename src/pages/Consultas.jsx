import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./consultas.module.css";

const STATUS_OPTS = [
  { id: "open", label: "Abierta", colorClass: styles.statusOpen },
  { id: "follow", label: "Seguimiento", colorClass: styles.statusFollow },
  { id: "closed", label: "Cerrada", colorClass: styles.statusClosed },
];

const SEVERITY_OPTS = [
  { id: "low", label: "Leve", colorClass: styles.sevLow },
  { id: "med", label: "Moderada", colorClass: styles.sevMed },
  { id: "high", label: "Alta", colorClass: styles.sevHigh },
  { id: "crit", label: "Crítica", colorClass: styles.sevCrit },
];

const VISIT_TYPES = [
  { id: "vac", label: "Vacuna", colorClass: styles.typeVac },
  { id: "gen", label: "Examen general", colorClass: styles.typeGen },
  { id: "ill", label: "Enfermedad", colorClass: styles.typeIll },
  { id: "sur", label: "Cirugía", colorClass: styles.typeSur },
  { id: "med", label: "Medicación", colorClass: styles.typeMed },
  { id: "den", label: "Dental", colorClass: "" },
  { id: "rou", label: "Control rutinario", colorClass: "" },
  { id: "eme", label: "Emergencia", colorClass: "" },
];

function genId() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 90 + 10)).padStart(4, "0");
  return `#EXP-${year}-${n}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function initials(str = "") {
  return str
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SectionCard({ icon, title, children, className = "" }) {
  return (
    <div className={`${styles.sectionCard} ${className}`}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionIcon}>{icon}</div>
        <span className={styles.sectionTitle}>{title}</span>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, children, full = false }) {
  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      {children}
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };

  return (
    <>
      {tags.length > 0 && (
        <div className={styles.tagRow}>
          {tags.map((t, i) => (
            <span key={i} className={styles.tag}>
              {t}
              <span className={styles.tagDel} onClick={() => onRemove(i)}>
                ×
              </span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.tagInputRow}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button type="button" className={styles.addBtn} onClick={handleAdd}>
          + Agregar
        </button>
      </div>
    </>
  );
}

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const IconWave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconPill = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconFlask = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M9 3v8l-4 9h14l-4-9V3" />
  </svg>
);

const IconSyringe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M2 12h20" />
  </svg>
);

const IconClip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

export default function ConsultaForm({ onSave }) {
  const navigate = useNavigate();

  const [consultaId] = useState(genId);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [doctor, setDoctor] = useState("");
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("med");
  const [visitTypes, setVisitTypes] = useState([]);

  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [bp, setBp] = useState("");
  const [spo2, setSpo2] = useState("");

  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [nextAppt, setNextAppt] = useState("");
  const [followReason, setFollowReason] = useState("");

  const [meds, setMeds] = useState([]);
  const [medNotes, setMedNotes] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [analyticsNotes, setAnalyticsNotes] = useState("");
  const [vaccines, setVaccines] = useState([]);
  const [vacBatch, setVacBatch] = useState("");

  const [mascotas, setMascotas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingDoctores, setLoadingDoctores] = useState(true);

  useEffect(() => {
    const loadMascotas = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mascotas");
        const data = await res.json();

        const normalizedMascotas = Array.isArray(data)
          ? data.map((mascota) => ({
              id:
                mascota.id ??
                mascota.Id ??
                mascota.ID ??
                mascota.mascotaId ??
                mascota.MascotaId ??
                mascota._id ??
                "",
              clienteId:
                mascota.clienteId ??
                mascota.ClienteId ??
                mascota.cliente_id ??
                mascota.idCliente ??
                mascota.IdCliente ??
                mascota.ownerId ??
                "",
              nombre: mascota.nombre ?? mascota.Nombre ?? "",
              raza: mascota.raza ?? mascota.Raza ?? "",
              edad: mascota.edad ?? mascota.Edad ?? "",
              sexo: mascota.sexo ?? mascota.Sexo ?? "",
              peso: mascota.peso ?? mascota.Peso ?? "",
            }))
          : [];

        setMascotas(normalizedMascotas);
      } catch (error) {
        console.error("Error loading mascotas:", error);
        setMascotas([]);
      } finally {
        setLoadingMascotas(false);
      }
    };

    loadMascotas();
  }, []);

  useEffect(() => {
    const loadClientes = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/clientes");
        const data = await res.json();

        const normalizedClientes = Array.isArray(data)
          ? data.map((cliente) => ({
              id:
                cliente.id ??
                cliente.Id ??
                cliente.ID ??
                cliente.clienteId ??
                cliente.ClienteId ??
                cliente._id ??
                "",
              nombre:
                cliente.nombre ??
                cliente.Nombre ??
                cliente.nombreCompleto ??
                cliente.NombreCompleto ??
                "",
              telefono:
                cliente.telefono ??
                cliente.Telefono ??
                cliente.tel ??
                "",
            }))
          : [];

        setClientes(normalizedClientes);
      } catch (error) {
        console.error("Error loading clientes:", error);
        setClientes([]);
      } finally {
        setLoadingClientes(false);
      }
    };

    loadClientes();
  }, []);

  useEffect(() => {
    const loadDoctores = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/doctores");
        const data = await res.json();

        const normalizedDoctores = Array.isArray(data)
          ? data.map((doctor) => ({
              id:
                doctor.id ??
                doctor.Id ??
                doctor._id ??
                doctor.nombre ??
                doctor.name ??
                "",
              nombre:
                doctor.nombre ??
                doctor.Nombre ??
                doctor.name ??
                doctor.Name ??
                String(doctor),
            }))
          : [];

        setDoctores(normalizedDoctores);
      } catch (error) {
        console.error("Error loading doctores:", error);
        setDoctores([]);
      } finally {
        setLoadingDoctores(false);
      }
    };

    loadDoctores();
  }, []);

  const mascotasConDueno = useMemo(() => {
    return mascotas.map((mascota) => {
      const cliente = clientes.find(
        (cliente) => String(cliente.id) === String(mascota.clienteId)
      );

      return {
        ...mascota,
        clienteNombre: cliente?.nombre || "Dueño desconocido",
        clienteTelefono: cliente?.telefono || "",
      };
    });
  }, [mascotas, clientes]);

  const selectedPatient = useMemo(() => {
    return mascotasConDueno.find(
      (mascota) => String(mascota.id) === String(patientId)
    );
  }, [mascotasConDueno, patientId]);

  const toggleType = (id) => {
    setVisitTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addTag = (setter) => (val) => setter((prev) => [...prev, val]);
  const removeTag = (setter) => (index) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    const payload = {
      consultaId,
      patientId,
      patient: selectedPatient,
      date,
      time,
      doctor,
      status,
      severity,
      visitTypes,
      vitals: { weight, temp, hr, rr, bp, spo2 },
      reason,
      diagnosis,
      observations,
      nextAppt,
      followReason,
      meds,
      medNotes,
      analytics,
      analyticsNotes,
      vaccines,
      vacBatch,
    };

    if (onSave) onSave(payload);
    else {
      alert(
        "Expediente guardado (prototipo)\n\n" +
          JSON.stringify(payload, null, 2)
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className={styles.headerTitles}>
          <h1 className={styles.headerH1}>Nueva Consulta</h1>
          <p className={styles.headerSub}>Expediente clínico</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.consultaId}>{consultaId}</div>
          <div className={styles.idLabel}>ID generado automáticamente</div>
        </div>
      </div>

      <div className={styles.formGrid}>
        <SectionCard
          icon={<IconUser />}
          title="Identificación"
          className={styles.full}
        >
          <div className={`${styles.bodyGrid} ${styles.cols3}`}>
            <Field label="Paciente (mascota)" full>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="">
                  {loadingMascotas || loadingClientes
                    ? "Cargando mascotas..."
                    : "— Seleccionar paciente —"}
                </option>

                {mascotasConDueno.map((mascota) => (
                  <option key={mascota.id} value={mascota.id}>
                    {mascota.nombre}
                    {mascota.raza ? ` — ${mascota.raza}` : ""}
                    {mascota.clienteNombre
                      ? ` — ${mascota.clienteNombre}`
                      : ""}
                  </option>
                ))}
              </select>

              {selectedPatient && (
                <div className={styles.patientPreview}>
                  <div className={styles.pAvatar}>
                    {initials(selectedPatient.nombre)}
                  </div>
                  <div>
                    <div className={styles.pName}>
                      {selectedPatient.nombre}
                      {selectedPatient.raza
                        ? ` — ${selectedPatient.raza}`
                        : ""}
                    </div>
                    <div className={styles.pSub}>
                      Dueño/a: {selectedPatient.clienteNombre}
                      {selectedPatient.clienteTelefono
                        ? ` · ${selectedPatient.clienteTelefono}`
                        : ""}
                    </div>
                  </div>
                </div>
              )}
            </Field>

            <Field label="Fecha">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>

            <Field label="Hora">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>

            <Field label="Doctor / Veterinario">
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option value="">
                  {loadingDoctores
                    ? "Cargando doctores..."
                    : "— Seleccionar —"}
                </option>

                {doctores.map((doc) => (
                  <option key={doc.id} value={doc.nombre}>
                    {doc.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Estado de la consulta">
              <div className={styles.pillRow}>
                {STATUS_OPTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.statusPill} ${
                      status === s.id ? s.colorClass : ""
                    }`}
                    onClick={() => setStatus(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Gravedad">
              <div className={styles.pillRow}>
                {SEVERITY_OPTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.sevPill} ${
                      severity === s.id ? s.colorClass : ""
                    }`}
                    onClick={() => setSeverity(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<IconPlus />}
          title="Tipo de consulta"
          className={styles.full}
        >
          <div className={styles.typePills}>
            {VISIT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.typePill} ${
                  visitTypes.includes(t.id)
                    ? `${styles.typePillActive} ${t.colorClass}`
                    : ""
                }`}
                onClick={() => toggleType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={<IconWave />}
          title="Signos vitales"
          className={styles.full}
        >
          <div className={`${styles.bodyGrid} ${styles.cols3}`}>
            <Field label="Peso (kg)">
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </Field>

            <Field label="Temperatura (°C)">
              <input
                type="number"
                step="0.1"
                placeholder="38.5"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </Field>

            <Field label="Frec. cardíaca (bpm)">
              <input
                type="number"
                placeholder="80"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
              />
            </Field>

            <Field label="Frec. respiratoria">
              <input
                type="number"
                placeholder="20"
                value={rr}
                onChange={(e) => setRr(e.target.value)}
              />
            </Field>

            <Field label="Presión arterial">
              <input
                type="text"
                placeholder="120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
              />
            </Field>

            <Field label="Saturación O₂ (%)">
              <input
                type="number"
                placeholder="98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<IconFile />}
          title="Diagnóstico clínico"
          className={styles.full}
        >
          <div className={`${styles.bodyGrid} ${styles.cols2}`}>
            <Field label="Motivo de consulta" full>
              <textarea
                placeholder="Describe el motivo principal de la visita…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ minHeight: 56 }}
              />
            </Field>

            <Field label="Diagnóstico" full>
              <textarea
                placeholder="Diagnóstico del veterinario…"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </Field>

            <Field label="Observaciones" full>
              <textarea
                placeholder="Observaciones adicionales, comportamiento del paciente, notas…"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </Field>

            <Field label="Próxima cita">
              <input
                type="date"
                value={nextAppt}
                onChange={(e) => setNextAppt(e.target.value)}
              />
            </Field>

            <Field label="Motivo de seguimiento">
              <input
                type="text"
                placeholder="Ej: revisión post-cirugía"
                value={followReason}
                onChange={(e) => setFollowReason(e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard icon={<IconPill />} title="Medicación">
          <TagInput
            tags={meds}
            onAdd={addTag(setMeds)}
            onRemove={removeTag(setMeds)}
            placeholder="Ej: Amoxicilina 500mg"
          />
          <Field label="Indicaciones / dosis">
            <textarea
              placeholder="Ej: 1 tableta cada 12h por 7 días…"
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              style={{ minHeight: 56 }}
            />
          </Field>
        </SectionCard>

        <SectionCard icon={<IconFlask />} title="Análisis realizados">
          <TagInput
            tags={analytics}
            onAdd={addTag(setAnalytics)}
            onRemove={removeTag(setAnalytics)}
            placeholder="Ej: Hemograma completo"
          />
          <Field label="Resultados / observaciones">
            <textarea
              placeholder="Resumen de resultados de laboratorio…"
              value={analyticsNotes}
              onChange={(e) => setAnalyticsNotes(e.target.value)}
              style={{ minHeight: 56 }}
            />
          </Field>
        </SectionCard>

        <SectionCard icon={<IconSyringe />} title="Vacunas aplicadas">
          <TagInput
            tags={vaccines}
            onAdd={addTag(setVaccines)}
            onRemove={removeTag(setVaccines)}
            placeholder="Ej: Rabia, Parvovirus"
          />
          <Field label="Lote / observaciones">
            <input
              type="text"
              placeholder="Número de lote o notas…"
              value={vacBatch}
              onChange={(e) => setVacBatch(e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard icon={<IconClip />} title="Archivos adjuntos">
          <div className={styles.dropZone}>
            <div className={styles.dropIcon}>📎</div>
            <p>Arrastra archivos o haz clic para subir</p>
            <span>Rayos X, ecografías, resultados de lab…</span>
          </div>
        </SectionCard>

        <div className={`${styles.full} ${styles.saveRow}`}>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => alert("Borrador guardado")}
          >
            Guardar borrador
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSave}
          >
            ✓ Guardar expediente
          </button>
        </div>
      </div>
    </div>
  );
}