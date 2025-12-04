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

// Estrutura achatada real retornada pelo backend no login
interface LoginFlatResponse {
    token: string;
    email: string;
    name: string;
    type: string;      // ADMIN | DRIVER
    userId: number;
    driverId: number | null;
    adminId: number | null;
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

            const rawJson: LoginFlatResponse & { error?: { message?: string }, message?: string } =
                await response.json().catch(() => ({} as any));

            if (!response.ok) {
                throw new Error(
                    rawJson.error?.message ||
                    rawJson.message ||
                    "Credenciais inválidas. Verifique seu CPF e senha."
                );
            }

            // Formato único: resposta achatada (igual ao JSON retornado pelo backend)
            const token = rawJson.token;
            const user = {
                id: rawJson.userId,
                name: rawJson.name,
                email: rawJson.email,
                type: rawJson.type,
            };

            if (!token || !user || !user.type) {
                throw new Error("Resposta de autenticação inválida do servidor.");
            }

            // Validar que apenas ADMIN pode fazer login no frontend
            if (user.type !== "ADMIN") {
                throw new Error("Acesso negado. Apenas administradores podem acessar o sistema.");
            }

            // Armazenar token e informações do usuário
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({
                email: user.email,
                name: user.name,
                type: user.type,
                id: user.id,
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
