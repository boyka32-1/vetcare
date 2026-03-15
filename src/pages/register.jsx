import "./register.css";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateAccountVetCare() {
  return (
    <div className="cl-body">
      <div className="cl-card">
        <div className="cl-header">
          <div className="cl-header-circle cl-header-circle--left"></div>
          <div className="cl-header-circle cl-header-circle--right"></div>

          <div className="cl-header-content">
            <h1 className="cl-title">Crear cuenta</h1>
            <p className="cl-sub">Llena la informacion para comenzar</p>
          </div>
        </div>

        <div className="cl-form-body">
          <div className="cl-form-container">
            <form className="cl-form">
              <div className="cl-field">
                <label>NOMBRE</label>
                <div className="cl-input-wrap">
                  <User size={18} />
                  <input type="text" placeholder="Enter your first name" />
                </div>
              </div>

              <div className="cl-field">
                <label>APELLIDO</label>
                <div className="cl-input-wrap">
                  <User size={18} />
                  <input type="text" placeholder="Enter your last name" />
                </div>
              </div>

              <div className="cl-field">
                <label>EMAIL</label>
                <div className="cl-input-wrap">
                  <Mail size={18} />
                  <input type="email" placeholder="Enter your email address" />
                </div>
              </div>

              <div className="cl-field">
                <label>CONTRASEÑA</label>
                <div className="cl-input-wrap">
                  <Lock size={18} />
                  <input type="password" placeholder="Choose a password" />
                </div>
              </div>

              <div className="cl-field">
                <label>CONFIRMAR CONTRASEÑA</label>
                <div className="cl-input-wrap">
                  <Lock size={18} />
                  <input type="password" placeholder="Repeat your password" />
                </div>
              </div>

              <button type="submit" className="cl-btn-primary">
                CREAR CUENTA
              </button>

              <Link to="/" className="cl-btn-secondary">
                Back to Login
              </Link>

              <div className="cl-note">
                <ShieldCheck size={16} />
                <span>Secure encrypted connection</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}