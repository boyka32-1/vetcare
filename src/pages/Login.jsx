import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import { User, Lock } from "lucide-react";



export default function Login() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passType = useMemo(() => (showPass ? "text" : "password"), [showPass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !contrasena.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usuario,
          password: contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/menu");
    } catch (err) {
      console.error(err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vc-body">
      <div className="vc-card">
        <div className="vc-card-header">
          <div className="vc-brand">
            <div className="vc-brand-icon">
              <img
                src="/logo-vetcare.png"
                alt="VetCare Logo"
                style={{ width: "80px" }}
              />
            </div>
            <div className="vc-brand-name">
              Vet<span>Care</span>
            </div>
          </div>

          <p className="vc-header-tagline">Veterinary management system</p>
        </div>

        <div className="vc-card-body">
          <h1 className="vc-form-title">Bienvenido </h1>
          <p className="vc-form-sub">Introduce tus credenciales para continuar</p>

          <form onSubmit={handleSubmit}>
            <div className="vc-field">
              <label htmlFor="usuario">Nombre de usuario</label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  id="usuario"
                  placeholder="Nombre de usuario"
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
                  placeholder="contraseña"
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <Lock className="vc-input-icon" size={18} />

                <button
                  className="vc-toggle-pass"
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "👁‍🗨" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button className="vc-btn-login" type="submit" disabled={loading}>
              {loading ? "Checking..." : "LOG IN"}
            </button>

            <Link to="/register" className="vc-btn-register">
              CREAR CUENTA
            </Link>

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
              Secure encrypted connection
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}