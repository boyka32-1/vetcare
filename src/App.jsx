import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Menu from "./pages/Menu.jsx";
import Clientes from "./pages/Clientes.jsx";
import Mascotas from "./pages/Mascotas.jsx";
import Registro from "./pages/Registro.jsx";
import Register from "./pages/register.jsx";
import Alertas from "./pages/Alertas.jsx";
import Consultas from "./pages/Consultas.jsx";
import Historial from "./pages/Historial.jsx";
import HistorialMascota from "./pages/HistorialMascota.jsx";
import ConsultaDetalle from "./pages/ConsultaDetalle.jsx";
import RegistroCliente from "./pages/RegistroCliente.jsx";
import ProtectedAdminRoute from "./pages/ProtectedAdminRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/admin/register"
          element={
            <ProtectedAdminRoute>
              <Register />
            </ProtectedAdminRoute>
          }
        />

        <Route path="/menu" element={<Menu />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/mascotas" element={<Mascotas />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route
          path="/historial-clinico/:mascotaId"
          element={<HistorialMascota />}
        />
        <Route path="/consulta/:consultaId" element={<ConsultaDetalle />} />
        <Route path="/registro/:clienteId" element={<RegistroCliente />} />
      </Routes>
    </BrowserRouter>
  );
}