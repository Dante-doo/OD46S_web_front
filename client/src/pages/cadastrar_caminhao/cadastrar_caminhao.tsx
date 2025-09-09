import React, { useState } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FiTruck } from "react-icons/fi";
import { LuPaintRoller } from "react-icons/lu";
import { FaRegCreditCard } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import "./cadastrar_caminhao.css";

const CadastrarCaminhao: React.FC = () => {
    const navigate = useNavigate();
    const [modelo, setModelo] = useState("");
    const [ano, setAno] = useState("");
    const [placa, setPlaca] = useState("");
    const [cor, setCor] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const novoCaminhao = { modelo, ano, placa, cor };

        const caminhõesStr = localStorage.getItem("caminhoes");
        const caminhões = caminhõesStr ? JSON.parse(caminhõesStr) : [];

        caminhões.push(novoCaminhao);
        localStorage.setItem("caminhoes", JSON.stringify(caminhões));

        navigate("/lista_caminhoes");
    };

    return (
        <div className="login-background">
            <div className="overlay">
                <div className="login-container">
                    <div className="login-logo">
                        <img
                            src="/garbage-truck.png"
                            alt="Logo"
                            className="logo-image"
                        />
                    </div>

                    <h3 className="text-white text-center mb-4 fw-bold">
                        CADASTRE AQUI O SEU VEÍCULO
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 input-icon">
                            <FiTruck className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="MODELO"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegCalendarAlt className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ANO"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegCreditCard className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="PLACA"
                                value={placa}
                                onChange={(e) => setPlaca(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <LuPaintRoller className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="COR"
                                value={cor}
                                onChange={(e) => setCor(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-login w-100">
                            REGISTRAR VEÍCULO
                        </button>

                        <div className="mt-3 d-flex justify-content-end">
                            <a
                                onClick={() => navigate("/lista_caminhoes")}
                                className="text-white"
                                style={{ cursor: "pointer" }}
                            >
                                Ver Lista de Caminhões
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CadastrarCaminhao;
