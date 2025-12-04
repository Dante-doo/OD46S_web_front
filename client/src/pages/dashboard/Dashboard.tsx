import React, { useState, useEffect } from 'react';
import { FaTruck, FaUsers, FaRoute, FaChartLine } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './Dashboard.css';

interface DashboardStats {
  totalVehicles: number;
  totalUsers: number;
  totalRoutes: number;
  totalExecutions: number;
  activeVehicles: number;
  activeRoutes: number;
  pendingExecutions: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalUsers: 0,
    totalRoutes: 0,
    totalExecutions: 0,
    activeVehicles: 0,
    activeRoutes: 0,
    pendingExecutions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, usersRes, routesRes, executionsRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.VEHICLES.LIST),
        apiService.get(API_ENDPOINTS.USERS.LIST),
        // Rotas exigem pelo menos o parâmetro search; usar defaults
        apiService.get(`${API_ENDPOINTS.ROUTES.LIST}?search=&page=1&limit=20&sort=name&order=asc`),
        apiService.get(API_ENDPOINTS.EXECUTIONS.LIST),
      ]);

      console.log('Resposta de veículos:', vehiclesRes);
      console.log('Resposta de usuários:', usersRes);
      console.log('Resposta de rotas:', routesRes);
      console.log('Resposta de execuções:', executionsRes);

      // O backend retorna uma lista diretamente para veículos
      let vehicles: any[] = [];
      if (Array.isArray(vehiclesRes.data)) {
        vehicles = vehiclesRes.data;
      } else if (vehiclesRes.data?.vehicles && Array.isArray(vehiclesRes.data.vehicles)) {
        vehicles = vehiclesRes.data.vehicles;
      } else if (vehiclesRes.data?.data?.vehicles && Array.isArray(vehiclesRes.data.data.vehicles)) {
        vehicles = vehiclesRes.data.data.vehicles;
      }

      const users = usersRes.data?.users || usersRes.data?.data?.users || [];
      const routes = routesRes.data?.routes || routesRes.data?.data?.routes || [];
      const executions = executionsRes.data?.executions || executionsRes.data?.data?.executions || [];

      // Filtrar veículos ativos: AVAILABLE é o status de veículo disponível/ativo
      // Também considerar active: true se existir
      const activeVehicles = Array.isArray(vehicles) 
        ? vehicles.filter((v: any) => {
            const status = v.status || '';
            const isActive = v.active !== false; // Considera ativo se não for explicitamente false
            return status === 'AVAILABLE' || status === 'ACTIVE' || status === 'ATIVO' || (isActive && status !== 'INACTIVE');
          }).length 
        : 0;
      
      console.log('Total de veículos:', vehicles.length);
      console.log('Veículos ativos:', activeVehicles);
      console.log('Status dos veículos:', vehicles.map((v: any) => ({ id: v.id, status: v.status, active: v.active })));

      const activeRoutes = Array.isArray(routes)
        ? routes.filter((r: any) => r.active === true || r.active === undefined).length
        : 0;

      const pendingExecutions = Array.isArray(executions)
        ? executions.filter((e: any) => e.status === 'IN_PROGRESS' || e.status === 'PENDING').length
        : 0;

      setStats({
        totalVehicles: Array.isArray(vehicles) ? vehicles.length : 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalRoutes: Array.isArray(routes) ? routes.length : 0,
        totalExecutions: Array.isArray(executions) ? executions.length : 0,
        activeVehicles,
        activeRoutes,
        pendingExecutions,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Caminhões',
      value: stats.totalVehicles,
      subtitle: `${stats.activeVehicles} ativos`,
      icon: FaTruck,
      color: '#3498db',
      link: '/vehicles',
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      subtitle: 'Cadastrados no sistema',
      icon: FaUsers,
      color: '#2ecc71',
      link: '/users',
    },
    {
      title: 'Total de Rotas',
      value: stats.totalRoutes,
      subtitle: `${stats.activeRoutes} ativas`,
      icon: FaRoute,
      color: '#f39c12',
      link: '/routes',
    },
    {
      title: 'Execuções',
      value: stats.totalExecutions,
      subtitle: `${stats.pendingExecutions} em andamento`,
      icon: FaChartLine,
      color: '#e74c3c',
      link: '/executions',
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card" onClick={() => window.location.href = card.link}>
              <div className="stat-card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                <Icon />
              </div>
              <div className="stat-card-content">
                <h3 className="stat-card-value">{card.value}</h3>
                <p className="stat-card-title">{card.title}</p>
                <p className="stat-card-subtitle">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h4>Ações Rápidas</h4>
          <div className="action-buttons">
            <a href="/vehicles" className="btn btn-primary">
              <FaTruck /> Cadastrar Caminhão
            </a>
            <a href="/users" className="btn btn-success">
              <FaUsers /> Cadastrar Usuário
            </a>
            <a href="/routes" className="btn btn-warning">
              <FaRoute /> Criar Rota
            </a>
            <a href="/assignments" className="btn btn-info">
              <FaChartLine /> Nova Escala
            </a>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

