import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Adm_register from "./pages/adm_register/adm_register";
import ListaCaminhoes from "./pages/lista_caminhoes/lista_caminhoes";
import "./App.css";
import CadastrarCaminhao from "./pages/cadastrar_caminhao/cadastrar_caminhao.tsx";

function App() {
    return (
        <div className="login-background">
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/adm_register" element={<Adm_register />} />
                    <Route path="/lista_caminhoes" element={<ListaCaminhoes />} />
                    <Route path="/cadastrar_caminhao" element={<CadastrarCaminhao />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
