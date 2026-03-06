import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { User, Lock } from "lucide-react";


export default function Login() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const passType = useMemo(() => (showPass ? "text" : "password"), [showPass]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulación frontend (sin backend aún)
    setTimeout(() => {
      setLoading(false);
      navigate("/menu");
    }, 600);
  };

  return (
    <div className="vc-body">
      <div className="vc-card">
        {/* Header */}
        <div className="vc-card-header">
          <div className="vc-brand">
            <div className="vc-brand-icon">
  <img src="/logo-vetcare.png" style={{width: "80px"}} />
</div>
            <div className="vc-brand-name">
              Vet<span>Care</span>
            </div>
          </div>

          <p className="vc-header-tagline">Sistema de gestión veterinaria</p>
        </div>

        {/* Form */}
        <div className="vc-card-body">
          <h1 className="vc-form-title">Bienvenido de vuelta</h1>
          <p className="vc-form-sub">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit}>
            <div className="vc-field">
              <label htmlFor="usuario">Usuario</label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  id="usuario"
                  placeholder="Usuario"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
                <User className="vc-input-icon" size={18} />
              </div>
            </div>

            <div className="vc-field">
              <label htmlFor="contrasena">Contraseña</label>
              <div className="vc-input-wrap">
                <input
                  type={passType}
                  id="contrasena"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <Lock className="vc-input-icon" size={18} />

                <button
                  className="vc-toggle-pass"
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="vc-row-options">
              <label className="vc-checkbox-wrap">
                <input type="checkbox" defaultChecked />
                <span>Recordarme</span>
              </label>

              <a
                href="#"
                className="vc-forgot"
                onClick={(e) => e.preventDefault()}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button className="vc-btn-login" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "INICIAR SESIÓN"}
            </button>

            <div className="vc-security-badge">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Conexión segura y cifrada
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}