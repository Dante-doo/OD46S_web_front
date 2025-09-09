import React, { useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

const Login: React.FC = () => {
    const navigate = useNavigate();

    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");

    const handleLogin = () => {
        const motoristaStr = localStorage.getItem("motorista");
        if (!motoristaStr) {
            alert("Nenhum cadastro encontrado. Por favor, registre-se primeiro.");
            return;
        }

        const motorista = JSON.parse(motoristaStr);

        if (motorista.cpf === cpf && motorista.senha === senha) {
            alert("Login realizado com sucesso!");
            navigate("/lista_caminhoes");
        } else {
            alert("CPF ou senha incorretos!");
        }
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

                    <h3 className="text-white text-center mb-4 fw-bold">FAÇA SEU LOGIN</h3>

                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-3 input-icon">
                            <FaRegUser className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="CPF"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FiLock className="icon" />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="SENHA"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            className="btn btn-login w-100"
                            onClick={handleLogin}
                        >
                            ENTRAR
                        </button>

                        <div className="mt-3 d-flex justify-content-end">
                            <Link to="/register" className="text-white fw-bold btn-register">
                                Registrar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
