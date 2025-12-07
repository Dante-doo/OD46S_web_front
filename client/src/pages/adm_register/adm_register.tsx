import React from "react";
import { FaRegUser, FaRegAddressCard, FaRegIdCard } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./adm_register.css";

const Adm_register: React.FC = () => {
    const navigate = useNavigate();

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

                    <h3 className="text-white text-center mb-4 fw-bold">CADASTRO DE ADMINISTRADOR</h3>

                    <button
                        type="button"
                        className="btn btn-login w-100 mb-4"
                        onClick={() => navigate("/register")}
                    >
                        Sou um Motorista
                    </button>

                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-3 input-icon">
                            <FaRegUser className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="NOME"
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegIdCard className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="CPF"
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegAddressCard className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="CRACHA"
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FiLock className="icon" />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="SENHA"
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FiLock className="icon" />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="CONFIRME SUA SENHA"
                            />
                        </div>

                        <button type="submit" className="btn btn-login w-100">
                            REGISTRAR
                        </button>

                        <div className="mt-3 d-flex justify-content-end">
                            <a
                                onClick={() => navigate("/login")}
                                className="text-white"
                                style={{ cursor: "pointer" }}
                            >
                                Voltar para Login
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Adm_register;
