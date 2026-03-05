import { useNavigate } from "react-router-dom";
import "./registro.css";

export default function Registro() {
  const navigate = useNavigate();

  return (
    <div className="rg-body">
      <div className="rg-card">
        <div className="rg-topbar">
          <button className="rg-back" type="button" onClick={() => navigate("/menu")}>
            ← Volver
          </button>
          <div className="rg-title">
            <h1>Registro</h1>
            <p>Clientes y mascotas</p>
          </div>
        </div>

        <div className="rg-columns">
          {/* Cliente */}
          <section className="rg-col">
            <h2 className="rg-section-title">Datos del cliente</h2>

            <div className="rg-field">
              <label>
                Nombre <span>*</span>
              </label>
              <input type="text" placeholder="Ej: Juan Pérez" />
            </div>

            <div className="rg-field">
              <label>
                Cédula <span>*</span>
              </label>
              <input type="text" placeholder="Ej: 1234567890" />
            </div>

            <div className="rg-field">
              <label>
                Dirección <span>*</span>
              </label>
              <input type="text" placeholder="Ej: Calle 123 #45-67" />
            </div>

            <div className="rg-field">
              <label>
                Correo electrónico <span>*</span>
              </label>
              <input type="email" placeholder="Ej: correo@ejemplo.com" />
            </div>

            <div className="rg-field">
              <label>
                Teléfono <span>*</span>
              </label>
              <input type="tel" placeholder="Ej: +57 300 000 0000" />
            </div>
          </section>

          <div className="rg-divider" />

          {/* Mascotas */}
          <section className="rg-col">
            <h2 className="rg-section-title">Mascotas</h2>

            <div className="rg-field">
              <label>
                Nombre <span>*</span>
              </label>
              <input type="text" placeholder="Ej: Luna" />
            </div>

            <div className="rg-row2">
              <div className="rg-field">
                <label>
                  Edad <span>*</span>
                </label>
                <input type="text" placeholder="Ej: 3" />
              </div>

              <div className="rg-field">
                <label>
                  Raza <span>*</span>
                </label>
                <div className="rg-select">
                  <select defaultValue="">
                    <option value="" disabled>
                      Selecciona...
                    </option>
                    <option>Labrador</option>
                    <option>Golden Retriever</option>
                    <option>Bulldog</option>
                    <option>Poodle</option>
                    <option>Pastor Alemán</option>
                    <option>Siamés</option>
                    <option>Persa</option>
                    <option>Maine Coon</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rg-row2">
              <div className="rg-field">
                <label>
                  Sexo <span>*</span>
                </label>
                <div className="rg-select">
                  <select defaultValue="">
                    <option value="" disabled>
                      Selecciona...
                    </option>
                    <option>Macho</option>
                    <option>Hembra</option>
                  </select>
                </div>
              </div>

              <div className="rg-field">
                <label>
                  Peso <span>*</span>
                </label>
                <input type="text" placeholder="Ej: 12 kg" />
              </div>
            </div>

            <div className="rg-field">
              <label>
                Observaciones <span>*</span>
              </label>
              <textarea placeholder="Ej: Vacunas al día, alérgica a..." />
            </div>

            <button
              className="rg-btn"
              type="button"
              onClick={() => alert("Mascota agregada (demo frontend)")}
            >
              Agregar nueva mascota
            </button>
          </section>
        </div>

        <div className="rg-bottom">
          <button className="rg-help" type="button" onClick={() => alert("Ayuda (demo)")}>
            ?
          </button>

          <button
            className="rg-terms"
            type="button"
            onClick={() => alert("Términos y condiciones (demo)")}
          >
            Términos y condiciones
          </button>
        </div>
      </div>
    </div>
  );
}