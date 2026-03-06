import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    contrasena: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulación temporal
    navigate("/");
  };

  return (
    <div className="rg-page">
      <header className="rg-topbar">
        <div className="rg-topbar-inner">
          <div className="rg-brand">
            <img src="/logo-vetcare.png" alt="VetCare" className="rg-logo" />
            <span className="rg-brand-name">VetCare</span>
          </div>

          <nav className="rg-nav">
            <a href="#">Servicios</a>
            <span className="rg-nav-active">Crear Cuenta</span>
            <a href="#">Mi Cuenta</a>
            <a href="#">Soporte</a>
          </nav>

          <div className="rg-auth-links">
            <Link to="/">Iniciar Sesión</Link>
            <Link to="/register">Registrarse</Link>
          </div>
        </div>
      </header>

      <main className="rg-main">
        <section className="rg-card">
          <form className="rg-form" onSubmit={handleSubmit}>
            <div className="rg-grid-2">
              <div className="rg-field">
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                />
              </div>

              <div className="rg-field">
                <label htmlFor="apellido">Apellido</label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  value={form.apellido}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="rg-grid-2">
  <div className="rg-field">
    <label htmlFor="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      placeholder="tu@ejemplo.com"
      value={form.email}
      onChange={handleChange}
    />
  </div>
</div>

            <div className="rg-grid-2">
  <div className="rg-field">
    <label htmlFor="contrasena">Contraseña</label>
    <input
      id="contrasena"
      name="contrasena"
      type="password"
      value={form.contrasena}
      onChange={handleChange}
    />
  </div>
</div>

            <div className="rg-footer-row">
              <p className="rg-terms">
                Al registrarte aceptas los <a href="#">Términos y Condiciones</a> de
                VetCare.
              </p>

              <Link to="/" className="rg-login-link">
                ¿Ya tienes cuenta?
              </Link>
            </div>

            <button type="submit" className="rg-submit-btn">
              CREAR CUENTA
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}