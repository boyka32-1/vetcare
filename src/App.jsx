import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Menu from "./pages/Menu.jsx";
import Clientes from "./pages/Clientes.jsx";
import Mascotas from "./pages/Mascotas.jsx";
import Registro from "./pages/Registro.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/mascotas" element={<Mascotas />} />
        <Route path="/registro" element={<Registro />} />
      </Routes>
    </BrowserRouter>
  );
}