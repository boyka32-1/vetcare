import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./registro.css";

export default function Registro() {
  const navigate = useNavigate();

  const clientes = useMemo(
    () => JSON.parse(localStorage.getItem("clientes")) || [],
    []
  );

  const mascotas = useMemo(
    () => JSON.parse(localStorage.getItem("mascotas")) || [],
    []
  );

  const mascotasPorCliente = (clienteId) =>
    mascotas.filter((mascota) => mascota.clienteId === clienteId);

  return (
    <div className="rg-body">
      <div className="rg-card">
        <div className="rg-topbar">
          <button className="rg-back" type="button" onClick={() => navigate("/menu")}>
            ← Volver
          </button>
          <div className="rg-title">
            <h1>Registro</h1>
            <p>Clientes y mascotas registradas</p>
          </div>
        </div>

        <div className="rg-list-wrap">
          {clientes.length === 0 ? (
            <div className="rg-empty">
              <h2>No hay clientes registrados</h2>
              <p>Primero registra un cliente y luego podrás asociarle mascotas.</p>
            </div>
          ) : (
            <div className="rg-list">
              {clientes.map((cliente) => {
                const mascotasCliente = mascotasPorCliente(cliente.id);

                return (
                  <article key={cliente.id} className="rg-record">
                    <div className="rg-record-header">
                      <h2>{cliente.nombre}</h2>
                      <span>{cliente.cedula}</span>
                    </div>

                    <div className="rg-record-grid">
                      <div className="rg-record-block">
                        <h3>Datos del cliente</h3>
                        <p><strong>Dirección:</strong> {cliente.direccion}</p>
                        <p><strong>Correo:</strong> {cliente.correo}</p>
                        <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                        <p><strong>Teléfono secundario:</strong> {cliente.telefono2 || "No registrado"}</p>
                      </div>

                      <div className="rg-record-block">
                        <h3>Mascotas asociadas</h3>

                        {mascotasCliente.length === 0 ? (
                          <p className="rg-no-pets">Este cliente aún no tiene mascotas registradas.</p>
                        ) : (
                          <div className="rg-pets">
                            {mascotasCliente.map((mascota) => (
                              <div key={mascota.id} className="rg-pet-card">
                                <p><strong>Nombre:</strong> {mascota.nombre}</p>
                                <p><strong>Edad:</strong> {mascota.edad}</p>
                                <p><strong>Raza:</strong> {mascota.raza}</p>
                                <p><strong>Sexo:</strong> {mascota.sexo}</p>
                                <p><strong>Peso:</strong> {mascota.peso}</p>
                                <p><strong>Observaciones:</strong> {mascota.observaciones || "Sin observaciones"}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="rg-back-menu-container">
          <button
            type="button"
            className="rg-back-menu"
            onClick={() => navigate("/menu")}
          >
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}