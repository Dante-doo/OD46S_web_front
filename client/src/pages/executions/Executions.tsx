import React, { useState, useEffect } from 'react';
import { FaEye, FaChartLine } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './Executions.css';

interface Execution {
  id: number;
  assignmentId?: number;
  driverName?: string;
  status: string;
  startTime?: string;
  endTime?: string;
  totalDistance?: number;
  totalPoints?: number;
}

const Executions: React.FC = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    setLoading(true);
    const response = await apiService.get(API_ENDPOINTS.EXECUTIONS.LIST);
    if (response.success && response.data) {
      const executionsData = response.data.executions || response.data.data?.executions || [];
      setExecutions(Array.isArray(executionsData) ? executionsData : []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="executions-page">
        <div className="page-header">
          <h2>Relatórios e Execuções</h2>
          <div className="header-actions">
            <button className="btn btn-outline-primary">
              <FaChartLine /> Gerar Relatório
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Motorista</th>
                <th>Status</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Distância (km)</th>
                <th>Pontos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    Nenhuma execução registrada
                  </td>
                </tr>
              ) : (
                executions.map((execution) => (
                  <tr key={execution.id}>
                    <td><strong>#{execution.id}</strong></td>
                    <td>{execution.driverName || '-'}</td>
                    <td>
                      <span className={`badge ${
                        execution.status === 'COMPLETED' ? 'bg-success' : 
                        execution.status === 'IN_PROGRESS' ? 'bg-warning' : 
                        'bg-secondary'
                      }`}>
                        {execution.status}
                      </span>
                    </td>
                    <td>{execution.startTime ? new Date(execution.startTime).toLocaleString('pt-BR') : '-'}</td>
                    <td>{execution.endTime ? new Date(execution.endTime).toLocaleString('pt-BR') : '-'}</td>
                    <td>{execution.totalDistance ? execution.totalDistance.toFixed(2) : '-'}</td>
                    <td>{execution.totalPoints || 0}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" title="Ver detalhes">
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Executions;

