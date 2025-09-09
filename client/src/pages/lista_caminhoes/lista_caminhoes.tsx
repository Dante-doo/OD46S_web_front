import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./lista_caminhoes.css";

interface Caminhao {
    modelo: string;
    ano: string;
    placa: string;
    cor: string;
}

const ListaCaminhoes: React.FC = () => {
    const navigate = useNavigate();
    const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);

    useEffect(() => {
        const caminhõesStr = localStorage.getItem("caminhoes");
        if (caminhõesStr) {
            setCaminhoes(JSON.parse(caminhõesStr));
        }
    }, []);

    return (
        <div className="lista-caminhoes-container">
            <div className="overlay">
                <h2 className="mb-4">Caminhões Cadastrados</h2>

                <button
                    className="btn btn-login mb-4"
                    onClick={() => navigate("/cadastrar_caminhao")}
                >
                    Registrar Caminhão
                </button>

                {caminhoes.length === 0 ? (
                    <p>Nenhum caminhão cadastrado.</p>
                ) : (
                    <ul className="caminhoes-list">
                        {caminhoes.map((c, index) => (
                            <li key={index} className="caminhao-item">
                                <strong>Modelo:</strong> {c.modelo} <br />
                                <strong>Ano:</strong> {c.ano} <br />
                                <strong>Placa:</strong> {c.placa} <br />
                                <strong>Cor:</strong> {c.cor} <br />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ListaCaminhoes;
