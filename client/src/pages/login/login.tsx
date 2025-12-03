import React, { useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api";
import "./login.css";

interface LoginRequest {
    cpf?: string;
    email?: string;
    password: string;
}

interface AuthResponse {
    token: string;
    email: string;
    name: string;
    type: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();

    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!cpf.trim() || !senha.trim()) {
            setError("Por favor, preencha CPF e senha.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const loginRequest: LoginRequest = {
                cpf: cpf.trim(),
                password: senha,
            };

            const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginRequest),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message || 
                    "Credenciais inválidas. Verifique seu CPF e senha."
                );
            }

            const authResponse: AuthResponse = await response.json();

            // Validar que apenas ADMIN pode fazer login no frontend
            if (authResponse.type !== "ADMIN") {
                throw new Error("Acesso negado. Apenas administradores podem acessar o sistema.");
            }

            // Armazenar token e informações do usuário
            localStorage.setItem("token", authResponse.token);
            localStorage.setItem("user", JSON.stringify({
                email: authResponse.email,
                name: authResponse.name,
                type: authResponse.type,
            }));

            // Redirecionar para o dashboard
            navigate("/dashboard");
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : "Erro ao fazer login. Tente novamente.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleLogin();
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

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                        <div className="mb-3 input-icon">
                            <FaRegUser className="icon" />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="CPF"
                                value={cpf}
                                onChange={(e) => {
                                    setCpf(e.target.value);
                                    setError("");
                                }}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-3 input-icon">
                            <FiLock className="icon" />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="SENHA"
                                value={senha}
                                onChange={(e) => {
                                    setSenha(e.target.value);
                                    setError("");
                                }}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-login w-100"
                            disabled={loading}
                        >
                            {loading ? "ENTRANDO..." : "ENTRAR"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
