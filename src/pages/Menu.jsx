import { useNavigate } from "react-router-dom";
import "./menu.css";

export default function Menu() {
  const navigate = useNavigate();

  const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  const mascotas = JSON.parse(localStorage.getItem("mascotas")) || [];

  return (
    <div className="mn-body">
      <div className="mn-card">
        <div className="mn-header">
          <div className="mn-header-left">
            <div className="mn-icon">≡</div>
            <div>
              <h1 className="mn-title">Menú de opciones</h1>
              <p className="mn-sub">Selecciona una opción para continuar</p>
            </div>
          </div>
        </div>

        <div className="mn-content">
          <div className="mn-buttons">
            <button className="mn-btn mn-primary" onClick={() => navigate("/registro")}>
              Registro (Ver clientes y mascotas)
            </button>

            <button className="mn-btn" onClick={() => navigate("/clientes")}>
              Registrar clientes
            </button>

            <button className="mn-btn" onClick={() => navigate("/mascotas")}>
              Registrar mascotas
            </button>

            <button className="mn-btn mn-danger" onClick={() => navigate("/")}>
              Cerrar sesión
            </button>
          </div>

          <div className="mn-stats">
            <div className="mn-stat">
              <div className="mn-stat-num">{clientes.length}</div>
              <div className="mn-stat-text">Clientes registrados</div>
            </div>
            <div className="mn-stat">
              <div className="mn-stat-num">{mascotas.length}</div>
              <div className="mn-stat-text">Mascotas registradas</div>
            </div>
            <div className="mn-stat">
              <div className="mn-stat-num">
                {clientes.length > 0 ? Math.round(mascotas.length / clientes.length) : 0}
              </div>
              <div className="mn-stat-text">Promedio mascotas</div>
            </div>
          </div>

          <div className="mn-note">
            <span className="mn-dot" />
            <span>
              Primero registra el cliente y luego asocia la mascota a ese cliente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}