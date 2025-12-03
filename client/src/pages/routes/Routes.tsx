import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaEdit } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './Routes.css';

interface Route {
  id: number;
  name: string;
  description: string;
  collection_type?: string; // Backend retorna com underscore
  collectionType?: string; // Fallback
  priority?: string;
  active: boolean;
  collection_points_count?: number; // Backend retorna com underscore
  pointsCount?: number; // Fallback
}

const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.ROUTES.LIST);
      console.log('Resposta completa de rotas:', response);
      
      if (response.success && response.data) {
        // O backend retorna { success: true, data: { routes: [...], pagination: {...} } }
        let routesData: Route[] = [];
        
        if (response.data.routes && Array.isArray(response.data.routes)) {
          routesData = response.data.routes;
        } else if (response.data.data && response.data.data.routes && Array.isArray(response.data.data.routes)) {
          routesData = response.data.data.routes;
        } else if (Array.isArray(response.data)) {
          routesData = response.data;
        }
        
        console.log('Rotas processadas:', routesData);
        setRoutes(routesData);
      } else {
        console.error('Erro ao carregar rotas:', response.error);
        setRoutes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
      setRoutes([]);
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
      <div className="routes-page">
        <div className="page-header">
          <h2>Gerenciamento de Rotas</h2>
          <button className="btn btn-primary">
            <FaPlus /> Nova Rota
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Pontos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Nenhuma rota cadastrada
                  </td>
                </tr>
              ) : (
                routes.map((route) => {
                  // Mapear campos do backend (snake_case) para exibição
                  const collectionType = route.collection_type || route.collectionType || '-';
                  const pointsCount = route.collection_points_count !== undefined 
                    ? route.collection_points_count 
                    : (route.pointsCount !== undefined ? route.pointsCount : 0);
                  const priority = route.priority || 'MEDIUM';
                  
                  return (
                  <tr key={route.id}>
                    <td><strong>{route.name}</strong></td>
                    <td>{route.description || '-'}</td>
                    <td>
                      <span className="badge bg-info">{collectionType}</span>
                    </td>
                    <td>
                      <span className={`badge ${priority === 'HIGH' ? 'bg-danger' : priority === 'MEDIUM' ? 'bg-warning' : 'bg-secondary'}`}>
                        {priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${route.active ? 'bg-success' : 'bg-secondary'}`}>
                        {route.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td>{pointsCount}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-outline-primary" title="Ver detalhes">
                          <FaEye />
                        </button>
                        <button className="btn btn-sm btn-outline-warning" title="Editar">
                          <FaEdit />
                        </button>
                      </div>
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

export default RoutesPage;

