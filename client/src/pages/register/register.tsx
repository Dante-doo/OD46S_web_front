import React, { useState } from "react";
import { FaRegUser, FaRegAddressCard, FaRegIdCard, FaRegCalendarAlt } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./register.css";

const Register: React.FC = () => {
    const navigate = useNavigate();

    // Estados para os campos
    const [nome, setNome] = useState("");
    const [cpf, setCpf] = useState("");
    const [dataNascimento, setDataNascimento] = useState("");
    const [registroCNH, setRegistroCNH] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");

    const handleRegister = () => {
        if (senha !== confirmaSenha) {
            alert("As senhas não coincidem!");
            return;
        }

        const motorista = {
            nome,
            cpf,
            dataNascimento,
            registroCNH,
            senha
        };

        localStorage.setItem("motorista", JSON.stringify(motorista));

        alert("Cadastro realizado com sucesso!");
        navigate("/login");
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

                    <h3 className="text-white text-center mb-4 fw-bold">CADASTRO DE MOTORISTA</h3>

                    <button
                        type="button"
                        className="btn btn-login w-100 mb-4"
                        onClick={() => navigate("/adm_register")}
                    >
                        Sou um Administrador
                    </button>

                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-3 input-icon">
                            <FaRegUser className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="NOME"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegIdCard className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="CPF"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegCalendarAlt className="icon" />
                            <input
                                type="date"
                                className="form-control"
                                placeholder="Data de Nascimento"
                                value={dataNascimento}
                                onChange={(e) => setDataNascimento(e.target.value)}
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FaRegAddressCard className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="REGISTRO CNH"
                                value={registroCNH}
                                onChange={(e) => setRegistroCNH(e.target.value)}
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

                        <div className="mb-3 input-icon">
                            <FiLock className="icon" />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="CONFIRME SUA SENHA"
                                value={confirmaSenha}
                                onChange={(e) => setConfirmaSenha(e.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            className="btn btn-login w-100"
                            onClick={handleRegister}
                        >
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

export default Register;
