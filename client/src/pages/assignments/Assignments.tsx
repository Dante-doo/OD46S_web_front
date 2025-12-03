import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './Assignments.css';

interface RouteBasic {
  id?: number;
  name?: string;
  periodicity?: string;
  collectionType?: string;
}

interface DriverBasic {
  id?: number;
  name?: string;
  email?: string;
  licenseNumber?: string;
}

interface VehicleBasic {
  id?: number;
  licensePlate?: string;
  model?: string;
  year?: number;
}

interface Assignment {
  id: number;
  route?: RouteBasic;
  driver?: DriverBasic;
  vehicle?: VehicleBasic;
  status: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.ASSIGNMENTS.LIST);
      console.log('Resposta completa de escalas:', response);
      
      if (response.success && response.data) {
        // O backend retorna { success: true, data: { assignments: [...], pagination: {...} } }
        let assignmentsData: Assignment[] = [];
        
        if (response.data.assignments && Array.isArray(response.data.assignments)) {
          assignmentsData = response.data.assignments;
        } else if (response.data.data && response.data.data.assignments && Array.isArray(response.data.data.assignments)) {
          assignmentsData = response.data.data.assignments;
        } else if (Array.isArray(response.data)) {
          assignmentsData = response.data;
        }
        
        console.log('Escalas processadas:', assignmentsData);
        setAssignments(assignmentsData);
      } else {
        console.error('Erro ao carregar escalas:', response.error);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
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
      <div className="assignments-page">
        <div className="page-header">
          <h2>Gerenciamento de Escalas</h2>
          <button className="btn btn-primary">
            <FaPlus /> Nova Escala
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rota</th>
                <th>Motorista</th>
                <th>Veículo</th>
                <th>Status</th>
                <th>Data Início</th>
                <th>Data Fim</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Nenhuma escala cadastrada
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => {
                  // Extrair dados dos objetos aninhados
                  const routeName = assignment.route?.name || '-';
                  const driverName = assignment.driver?.name || '-';
                  const vehiclePlate = assignment.vehicle?.licensePlate || '-';
                  const status = assignment.status || 'UNKNOWN';
                  
                  return (
                  <tr key={assignment.id}>
                    <td><strong>{routeName}</strong></td>
                    <td>{driverName}</td>
                    <td>{vehiclePlate}</td>
                    <td>
                      <span className={`badge ${status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                        {status}
                      </span>
                    </td>
                    <td>{assignment.startDate ? new Date(assignment.startDate).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>{assignment.endDate ? new Date(assignment.endDate).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" title="Ver detalhes">
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Assignments;

