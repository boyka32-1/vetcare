import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./consultas.module.css";
import {
  applyFieldFormatting,
  validateFields,
  validators,
} from "../utils/formRules";

const API_URL = "http://localhost:5000";

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

function genId() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000);
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

function getVisitTypeColorClass(codigo) {
  const map = {
    vac: styles.typeVac,
    gen: styles.typeGen,
    ill: styles.typeIll,
    sur: styles.typeSur,
    med: styles.typeMed,
    den: "",
    rou: "",
    eme: "",
    emb: "",
  };

  return map[codigo] || "";
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

function Field({ label, children, full = false, required = false }) {
  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
      {label && (
        <label className={styles.fieldLabel}>
          {label} {required && <span style={{ color: "#c0392b" }}>*</span>}
        </label>
      )}
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
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconPlus = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const IconWave = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconFile = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconPill = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconFlask = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 3h6M9 3v8l-4 9h14l-4-9V3" />
  </svg>
);

const IconSyringe = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v20M2 12h20" />
  </svg>
);

const IconClip = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

export default function ConsultaForm({ onSave }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const patientSearchRef = useRef(null);

  const [consultaId] = useState(genId);
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [doctor, setDoctor] = useState("");
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("med");
  const [visitTypes, setVisitTypes] = useState([]);
  const [availableVisitTypes, setAvailableVisitTypes] = useState([]);
  const [loadingVisitTypes, setLoadingVisitTypes] = useState(true);

  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [bp, setBp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [nextAppt, setNextAppt] = useState("");
  const [followReason, setFollowReason] = useState("");
  const [pregMonths, setPregMonths] = useState("");
const [pregBabies, setPregBabies] = useState("");
const [pregRisk, setPregRisk] = useState("bajo");
const [pregDeliveryType, setPregDeliveryType] = useState("");
const [pregDueDate, setPregDueDate] = useState("");
const [pregNotes, setPregNotes] = useState("");

  const [meds, setMeds] = useState([]);
  const [medNotes, setMedNotes] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [analyticsNotes, setAnalyticsNotes] = useState("");
  const [vaccines, setVaccines] = useState([]);
  const [vacBatch, setVacBatch] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [mascotas, setMascotas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [doctores, setDoctores] = useState([]);

  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingDoctores, setLoadingDoctores] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayDate = today();
  const nowTime = currentTime();
  const isPregnancyVisit = visitTypes.includes("emb");
  console.log("visitTypes:", visitTypes);
console.log("isPregnancyVisit:", isPregnancyVisit);

  const vitalRules = {
    weight: {
      formatter: "decimalNumber",
      validate: [
        {
          test: validators.maxLength(5),
          message: "El peso no puede exceder 5 caracteres.",
        },
      ],
    },
    temp: {
      formatter: "decimalNumber",
      validate: [
        {
          test: validators.maxLength(4),
          message: "La temperatura no puede exceder 4 caracteres.",
        },
      ],
    },
    hr: {
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.maxLength(3),
          message: "La frecuencia cardíaca no puede exceder 3 dígitos.",
        },
      ],
    },
    rr: {
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.maxLength(3),
          message: "La frecuencia respiratoria no puede exceder 3 dígitos.",
        },
      ],
    },
    bp: {
      formatter: "bloodPressure",
      validate: [
        {
          test: validators.maxLength(7),
          message: "La presión arterial no puede exceder el formato 000/000.",
        },
      ],
    },
    spo2: {
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.maxLength(3),
          message: "La saturación O₂ no puede exceder 3 dígitos.",
        },
      ],
    },
  };

  const vitalSetters = {
    weight: setWeight,
    temp: setTemp,
    hr: setHr,
    rr: setRr,
    bp: setBp,
    spo2: setSpo2,
  };

 const handleVitalChange = (name, value) => {
    let formattedValue = applyFieldFormatting(name, value, vitalRules);

    if (name === "weight") formattedValue = formattedValue.slice(0, 5);
    if (name === "temp") formattedValue = formattedValue.slice(0, 4);
    if (name === "hr" || name === "rr" || name === "spo2") {
      formattedValue = formattedValue.slice(0, 3);
    }
    if (name === "bp") formattedValue = formattedValue.slice(0, 7);

    vitalSetters[name](formattedValue);

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleDateChange = (value) => {
    if (value !== todayDate) {
      setDate(todayDate);
      return;
    }

    setDate(value);

    if (time < nowTime) {
      setTime(nowTime);
    }
  };

  const handleTimeChange = (value) => {
    if (date === todayDate && value < nowTime) {
      setTime(nowTime);
      return;
    }

    setTime(value);
  };

  useEffect(() => {
    const loadMascotas = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch("http://localhost:5000/api/mascotas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

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
  }, [navigate]);

  useEffect(() => {
    const loadClientes = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch("http://localhost:5000/api/clientes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

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
  }, [navigate]);

  useEffect(() => {
    const loadDoctores = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch("http://localhost:5000/api/doctores", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

        const normalizedDoctores = Array.isArray(data)
          ? data.map((doctor) => ({
              id:
                doctor.id ??
                doctor.Id ??
                doctor.doctorId ??
                doctor.DoctorId ??
                doctor._id ??
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
  }, [navigate]);

  useEffect(() => {
    const loadTiposConsulta = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch("http://localhost:5000/api/tipos-consulta", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

        const normalizedTipos = Array.isArray(data)
          ? data.map((tipo) => ({
              id: tipo.id ?? "",
              codigo: tipo.codigo ?? "",
              nombre: tipo.nombre ?? "",
              colorClass: getVisitTypeColorClass(tipo.codigo),
            }))
          : [];

        setAvailableVisitTypes(normalizedTipos);
      } catch (error) {
        console.error("Error loading tipos de consulta:", error);
        setAvailableVisitTypes([]);
      } finally {
        setLoadingVisitTypes(false);
      }
    };

    loadTiposConsulta();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        patientSearchRef.current &&
        !patientSearchRef.current.contains(event.target)
      ) {
        setShowPatientResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

 const filteredMascotas = useMemo(() => {
    const search = patientSearch.trim().toLowerCase();

    if (!search) return mascotasConDueno;

    return mascotasConDueno.filter((mascota) => {
      const nombre = mascota.nombre?.toLowerCase() || "";
      const raza = mascota.raza?.toLowerCase() || "";
      const clienteNombre = mascota.clienteNombre?.toLowerCase() || "";
      const clienteTelefono = String(mascota.clienteTelefono || "").toLowerCase();

      return (
        nombre.includes(search) ||
        raza.includes(search) ||
        clienteNombre.includes(search) ||
        clienteTelefono.includes(search)
      );
    });
  }, [mascotasConDueno, patientSearch]);

  const selectedPatient = useMemo(() => {
    return mascotasConDueno.find(
      (mascota) => String(mascota.id) === String(patientId)
    );
  }, [mascotasConDueno, patientId]);

  const handleSelectPatient = (mascota) => {
    setPatientId(mascota.id);
    setPatientSearch(
      `${mascota.nombre}${mascota.raza ? ` — ${mascota.raza}` : ""}${
        mascota.clienteNombre ? ` — ${mascota.clienteNombre}` : ""
      }${mascota.clienteTelefono ? ` — ${mascota.clienteTelefono}` : ""}`
    );
    setShowPatientResults(false);
  };

  const toggleType = (codigo) => {
    setVisitTypes((prev) =>
      prev.includes(codigo)
        ? prev.filter((t) => t !== codigo)
        : [...prev, codigo]
    );
  };

  const addTag = (setter) => (val) => setter((prev) => [...prev, val]);
  const removeTag = (setter) => (index) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const handleFilesSelected = (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    setAttachedFiles((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );

      const newUniqueFiles = files.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...prev, ...newUniqueFiles];
    });
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mapStatusToDb = (value) => {
    const map = {
      open: "abierta",
      follow: "seguimiento",
      closed: "cerrada",
    };
    return map[value] || value;
  };

  const mapSeverityToDb = (value) => {
    const map = {
      low: "leve",
      med: "moderada",
      high: "alta",
      crit: "critica",
    };
    return map[value] || value;
  };

  const handleSave = async () => {
    if (!patientId) {
      alert("Debes seleccionar una mascota.");
      return;
    }

    if (!doctor) {
      alert("Debes seleccionar un doctor.");
      return;
    }

    if (!date || date !== todayDate) {
      alert("La consulta solo puede registrarse con la fecha actual.");
      return;
    }

    if (!time || time < nowTime) {
      alert("La hora no puede ser menor que la hora actual.");
      return;
    }

    if (!reason.trim()) {
      alert("Debes escribir el motivo de consulta.");
      return;
    }

    if (!diagnosis.trim()) {
      alert("Debes escribir el diagnóstico.");
      return;
    }

    if (visitTypes.length === 0) {
      alert("Debes seleccionar al menos un tipo de consulta.");
      return;
    }

    const vitalValues = { weight, temp, hr, rr, bp, spo2 };
    const vitalErrors = validateFields(vitalValues, vitalRules);

    if (Object.keys(vitalErrors).length > 0) {
      setFieldErrors(vitalErrors);
      alert("Corrige los campos de signos vitales.");
      return;
    }

    if (visitTypes.includes("vac") && vaccines.length === 0) {
      alert("Si seleccionas tipo Vacuna, debes agregar al menos una vacuna aplicada.");
      return;
    }

    if (visitTypes.includes("med") && meds.length === 0) {
      alert("Si seleccionas tipo Medicación, debes agregar al menos un medicamento.");
      return;
    }
    if (isPregnancyVisit) {
  if (!pregMonths.trim()) {
    alert("Debes indicar los meses de gestación.");
    return;
  }

  if (!pregBabies.trim()) {
    alert("Debes indicar cuántas crías son.");
    return;
  }

  if (!pregDeliveryType) {
    alert("Debes seleccionar el tipo de parto.");
    return;
  }
}

    if (status === "follow") {
      if (!nextAppt) {
        alert("Debes indicar la próxima cita para una consulta de seguimiento.");
        return;
      }

      if (!followReason.trim()) {
        alert("Debes indicar el motivo de seguimiento.");
        return;
      }
    }

    try {
      setSaving(true);

      if (onSave) {
        await onSave({
          consulta_codigo: consultaId,
          pet_id: patientId,
          client_id: selectedPatient?.clienteId || null,
          doctor_id: doctor,
          fecha: date,
          hora: time,
          motivo: reason,
          diagnostico: diagnosis,
          observaciones: observations,
          estado: mapStatusToDb(status),
          gravedad: mapSeverityToDb(severity),
          tipos_consulta: visitTypes,
          proxima_cita: nextAppt || null,
          motivo_seguimiento: followReason || null,
          embarazo: isPregnancyVisit
  ? {
      meses_gestacion: pregMonths,
      cantidad_crias: pregBabies,
      riesgo: pregRisk,
      tipo_parto: pregDeliveryType,
      fecha_probable_parto: pregDueDate || null,
      observaciones_embarazo: pregNotes || null,
    }
  : null,
          vitals: { weight, temp, hr, rr, bp, spo2 },
          medicaciones: meds,
          notas_medicacion: medNotes,
          analisis: analytics,
          notas_analisis: analyticsNotes,
          vacunas: vaccines,
          lote_vacuna: vacBatch,
          patient: selectedPatient || null,
          attachedFiles,
        });

        alert("Consulta guardada correctamente.");
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const formData = new FormData();

      formData.append("consulta_codigo", consultaId);
      formData.append("pet_id", patientId);
      formData.append("client_id", selectedPatient?.clienteId || "");
      formData.append("doctor_id", doctor);
      formData.append("fecha", date);
      formData.append("hora", time);
      formData.append("motivo", reason);
      formData.append("diagnostico", diagnosis);
      formData.append("observaciones", observations);
      formData.append("estado", mapStatusToDb(status));
      formData.append("gravedad", mapSeverityToDb(severity));
      formData.append("proxima_cita", nextAppt || "");
      formData.append("motivo_seguimiento", followReason || "");
      formData.append("meses_gestacion", isPregnancyVisit ? pregMonths : "");
formData.append("cantidad_crias", isPregnancyVisit ? pregBabies : "");
formData.append("riesgo_embarazo", isPregnancyVisit ? pregRisk : "");
formData.append("tipo_parto", isPregnancyVisit ? pregDeliveryType : "");
formData.append("fecha_probable_parto", isPregnancyVisit ? pregDueDate : "");
formData.append( "observaciones_embarazo",
  isPregnancyVisit ? pregNotes : ""
);

      formData.append("weight", weight || "");
      formData.append("temp", temp || "");
      formData.append("hr", hr || "");
      formData.append("rr", rr || "");
      formData.append("bp", bp || "");
      formData.append("spo2", spo2 || "");

      formData.append("notas_medicacion", medNotes || "");
      formData.append("notas_analisis", analyticsNotes || "");
      formData.append("lote_vacuna", vacBatch || "");

      formData.append("tipos_consulta", JSON.stringify(visitTypes));
      formData.append("medicaciones", JSON.stringify(meds));
      formData.append("analisis", JSON.stringify(analytics));
      formData.append("vacunas", JSON.stringify(vaccines));

      attachedFiles.forEach((file) => {
        formData.append("adjuntos", file);
      });

      const res = await fetch("http://localhost:5000/api/consultas", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Error al guardar la consulta");
      }

      alert("Consulta guardada correctamente.");
      navigate(-1);
    } catch (error) {
      console.error("Error saving consulta:", error);
      alert(error.message || "No se pudo guardar la consulta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
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
              <Field label="Paciente (mascota)" full required>
                <div className={styles.patientSearchWrap} ref={patientSearchRef}>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, raza, dueño o teléfono..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientResults(true);
                      setPatientId("");
                    }}
                    onFocus={() => setShowPatientResults(true)}
                  />

                  {showPatientResults && (
                    <div className={styles.patientResults}>
                      {loadingMascotas || loadingClientes ? (
                        <div className={styles.patientResultItem}>
                          Cargando mascotas...
                        </div>
                      ) : filteredMascotas.length === 0 ? (
                        <div className={styles.patientResultItem}>
                          No hay resultados
                        </div>
                      ) : (
                        filteredMascotas.map((mascota) => (
                          <button
                            key={mascota.id}
                            type="button"
                            className={styles.patientResultBtn}
                            onClick={() => handleSelectPatient(mascota)}
                          >
                            <div className={styles.patientResultName}>
                              {mascota.nombre}
                              {mascota.raza ? ` — ${mascota.raza}` : ""}
                            </div>
                            <div className={styles.patientResultSub}>
                              {mascota.clienteNombre || "Dueño desconocido"}
                              {mascota.clienteTelefono
                                ? ` — ${mascota.clienteTelefono}`
                                : ""}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className={styles.patientPreview}>
                    <div className={styles.pAvatar}>
                      {initials(selectedPatient.nombre)}
                    </div>
                    <div>
                      <div className={styles.pName}>
                        {selectedPatient.nombre}
                        {selectedPatient.raza ? ` — ${selectedPatient.raza}` : ""}
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

              <Field label="Fecha" required>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={todayDate}
                  max={todayDate}
                />
              </Field>

              <Field label="Hora" required>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  min={date === todayDate ? nowTime : undefined}
                />
              </Field>

              <Field label="Doctor / Veterinario" required>
                <select
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                >
                  <option value="">
                    {loadingDoctores ? "Cargando doctores..." : "— Seleccionar —"}
                  </option>

                  {doctores.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Estado de la consulta" required>
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

              <Field label="Gravedad" required>
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
              {loadingVisitTypes ? (
                <div>Cargando tipos de consulta...</div>
              ) : availableVisitTypes.length === 0 ? (
                <div>No hay tipos de consulta disponibles.</div>
              ) : (
                availableVisitTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.typePill} ${
                      visitTypes.includes(t.codigo)
                        ? `${styles.typePillActive} ${t.colorClass}`
                        : ""
                    }`}
                    onClick={() => toggleType(t.codigo)}
                  >
                    {t.nombre}
                  </button>
                ))
              )}
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
                  type="text"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => handleVitalChange("weight", e.target.value)}
                />
                {fieldErrors.weight && (
                  <small style={{ color: "red" }}>{fieldErrors.weight}</small>
                )}
              </Field>

              <Field label="Temperatura (°C)">
                <input
                  type="text"
                  placeholder="38.5"
                  value={temp}
                  onChange={(e) => handleVitalChange("temp", e.target.value)}
                />
                {fieldErrors.temp && (
                  <small style={{ color: "red" }}>{fieldErrors.temp}</small>
                )}
              </Field>

              <Field label="Frec. cardíaca (bpm)">
                <input
                  type="text"
                  placeholder="80"
                  value={hr}
                  onChange={(e) => handleVitalChange("hr", e.target.value)}
                />
                {fieldErrors.hr && (
                  <small style={{ color: "red" }}>{fieldErrors.hr}</small>
                )}
              </Field>

              <Field label="Frec. respiratoria">
                <input
                  type="text"
                  placeholder="20"
                  value={rr}
                  onChange={(e) => handleVitalChange("rr", e.target.value)}
                />
                {fieldErrors.rr && (
                  <small style={{ color: "red" }}>{fieldErrors.rr}</small>
                )}
              </Field>

              <Field label="Presión arterial">
                <input
                  type="text"
                  placeholder="120/80"
                  value={bp}
                  onChange={(e) => handleVitalChange("bp", e.target.value)}
                />
                {fieldErrors.bp && (
                  <small style={{ color: "red" }}>{fieldErrors.bp}</small>
                )}
              </Field>

              <Field label="Saturación O₂ (%)">
                <input
                  type="text"
                  placeholder="98"
                  value={spo2}
                  onChange={(e) => handleVitalChange("spo2", e.target.value)}
                />
                {fieldErrors.spo2 && (
                  <small style={{ color: "red" }}>{fieldErrors.spo2}</small>
                )}
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<IconFile />}
            title="Diagnóstico clínico"
            className={styles.full}
          >
            <div className={`${styles.bodyGrid} ${styles.cols2}`}>
              <Field label="Motivo de consulta" full required>
                <textarea
                  placeholder="Describe el motivo principal de la visita…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ minHeight: 56 }}
                />
              </Field>

              <Field label="Diagnóstico" full required>
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
          {isPregnancyVisit && (
  <SectionCard
    icon={<IconFile />}
    title="Control de embarazo"
    className={styles.full}
  >
    <div className={`${styles.bodyGrid} ${styles.cols2}`}>
      <Field label="Meses de gestación" required>
        <input
          type="text"
          value={pregMonths}
          onChange={(e) => setPregMonths(e.target.value)}
        />
      </Field>

      <Field label="Cantidad de crías" required>
        <input
          type="text"
          value={pregBabies}
          onChange={(e) => setPregBabies(e.target.value)}
        />
      </Field>

      <Field label="Riesgo del embarazo" required>
        <select
          value={pregRisk}
          onChange={(e) => setPregRisk(e.target.value)}
        >
          <option value="bajo">Bajo</option>
          <option value="alto">Alto</option>
        </select>
      </Field>

      <Field label="Tipo de parto" required>
        <select
          value={pregDeliveryType}
          onChange={(e) => setPregDeliveryType(e.target.value)}
        >
          <option value="">— Seleccionar —</option>
          <option value="normal">Normal</option>
          <option value="cesarea">Cesárea</option>
        </select>
      </Field>

      <Field label="Fecha probable de parto">
        <input
          type="date"
          value={pregDueDate}
          onChange={(e) => setPregDueDate(e.target.value)}
        />
      </Field>

      <Field label="Observaciones del embarazo" full>
        <textarea
          value={pregNotes}
          onChange={(e) => setPregNotes(e.target.value)}
        />
      </Field>
    </div>
  </SectionCard>
)}

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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <div
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
            >
              <div className={styles.dropIcon}>📎</div>
              <p>Arrastra archivos o haz clic para subir</p>
              <span>Rayos X, ecografías, resultados de lab…</span>
            </div>

            {attachedFiles.length > 0 && (
              <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                {attachedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      border: "1px solid #d6e3e2",
                      borderRadius: "12px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#244244" }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6d8a8c" }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.btnOutline}
                      onClick={() => removeFile(index)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className={`${styles.full} ${styles.saveRow}`}>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.btnOutline}
              onClick={() => alert("Borrador guardado")}
              disabled={saving}
            >
              Guardar borrador
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "✓ Guardar expediente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

