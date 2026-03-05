import { useNavigate } from "react-router-dom";
import "./menu.css";

export default function Menu() {
  const navigate = useNavigate();

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
              Registro (Cliente + Mascota)
            </button>

            <button className="mn-btn" onClick={() => navigate("/clientes")}>
              Clientes
            </button>

            <button className="mn-btn" onClick={() => navigate("/mascotas")}>
              Mascotas
            </button>

            <button className="mn-btn mn-danger" onClick={() => navigate("/")}>
              Cerrar sesión
            </button>
          </div>

          {/* Mini dashboard (opcional visual, no backend) */}
          <div className="mn-stats">
            <div className="mn-stat">
              <div className="mn-stat-num">120</div>
              <div className="mn-stat-text">Mascotas registradas</div>
            </div>
            <div className="mn-stat">
              <div className="mn-stat-num">80</div>
              <div className="mn-stat-text">Cierres</div>
            </div>
            <div className="mn-stat">
              <div className="mn-stat-num">50</div>
              <div className="mn-stat-text">Citas pendientes</div>
            </div>
          </div>

          <div className="mn-note">
            <span className="mn-dot" />
            <span>Notificación</span>
          </div>
        </div>
      </div>
    </div>
  );
}