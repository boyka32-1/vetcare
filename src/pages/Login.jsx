import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // aquí decides a dónde ir después de registrarse
      navigate("/menu"); // o "/login"
    }, 900);
  };

  return (
    <div className="auth-page">
      {/* NAVBAR */}
      <nav className="auth-nav">
        <a className="auth-brand" href="#" onClick={(e) => e.preventDefault()}>
          <img src="/logo-vetcare.png" alt="VetCare" />
          <span className="auth-brand-name">
            Vet<span>Care</span>
          </span>
        </a>

        <div className="auth-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Servicios</a>
          <a href="#" className="active" onClick={(e) => e.preventDefault()}>Crear Cuenta</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Mi Cuenta</a>
          {/* Quitado: Centro de Ayuda */}
          <a href="#" onClick={(e) => e.preventDefault()}>Soporte</a>
        </div>

        <div className="auth-right">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
            Iniciar Sesión
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Registrarse
          </a>
        </div>
      </nav>

      {/* MAIN */}
      <main className="auth-main">
        <div className="auth-banner">Crear una Cuenta Gratis</div>

        <section className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="auth-row two">
              <div className="auth-field">
                <label>Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  type="text"
                  placeholder=""
                />
              </div>

              <div className="auth-field">
                <label>Apellido</label>
                <input
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  type="text"
                  placeholder=""
                />
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field full">
                <label>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="tu@ejemplo.com"
                />
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field full">
                <label>Contraseña</label>
                <input
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  type="password"
                  placeholder=""
                />
              </div>
            </div>

            <div className="auth-footer registerFooter">
              <p className="auth-terms">
                Al registrarte aceptas los <a href="#">Términos</a><br />
                y <a href="#">Condiciones</a> de VetCare.
              </p>

              <a
                className="auth-link"
                href="#"
                onClick={(e) => { e.preventDefault(); navigate("/login"); }}
              >
                ¿Ya tienes cuenta?
              </a>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Creando..." : "CREAR CUENTA"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}