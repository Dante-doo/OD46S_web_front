import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import '../Vehicles/Vehicles.css';
import './Routes.css';


interface Route {
  id: number;
  name: string;
  description: string;
  collection_type?: string;
  collectionType?: string;
  priority?: string;
  active: boolean;
  collection_points_count?: number;
  pointsCount?: number;
  periodicity?: string;
  notes?: string;
  estimated_time_minutes?: number;
  distance_km?: number;
}

interface RouteFormDataType {
  id?: number;
  name: string;
  description: string;
  collection_type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | '';
  periodicity: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | '';
  estimated_time_minutes: number | '';
  distance_km: number | '';
  active: boolean;
  notes: string;
}

const COLLECTION_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const PERIODICITIES = [
  'DIÁRIA',
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'ANUAL',
  'SOB DEMANDA'
];
const INITIAL_FORM_DATA: RouteFormDataType = {
  name: '',
  description: '',
  collection_type: '',
  periodicity: '',
  priority: 'MEDIUM',
  estimated_time_minutes: '',
  distance_km: '',
  active: true,
  notes: '',
};


const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormDataType>(INITIAL_FORM_DATA);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.ROUTES.LIST}?search=&page=1&limit=20&sort=name&order=asc`;
      const response = await apiService.get(url);

      if (response.success && response.data) {
        let routesData: Route[] = [];

        if (response.data.routes && Array.isArray(response.data.routes)) {
          routesData = response.data.routes;
        } else if (response.data.data && response.data.data.routes && Array.isArray(response.data.data.routes)) {
          routesData = response.data.data.routes;
        } else if (Array.isArray(response.data)) {
          routesData = response.data;
        }

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

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingRoute(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (route: Route) => {
    setEditingRoute(route);

    const collectionType = route.collection_type || route.collectionType || '';
    const priority = route.priority || 'MEDIUM';
    const periodicityValue = PERIODICITIES.includes(route.periodicity || '') ? route.periodicity! : '';


    setFormData({
      id: route.id,
      name: route.name || '',
      description: route.description || '',
      collection_type: COLLECTION_TYPES.includes(collectionType.toUpperCase()) ? collectionType.toUpperCase() as any : '',
      periodicity: periodicityValue, // Usa o valor ajustado
      priority: PRIORITIES.includes(priority.toUpperCase()) ? priority.toUpperCase() as any : 'MEDIUM',
      estimated_time_minutes: route.estimated_time_minutes || route.estimated_time_minutes === 0 ? route.estimated_time_minutes : '',
      distance_km: route.distance_km || route.distance_km === 0 ? route.distance_km : '',
      active: route.active !== undefined ? route.active : true,
      notes: route.notes || '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    let newValue: any;
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    } else if (name === 'active') {
      newValue = value === 'true'; // Conversão do select para boolean
    } else {
      newValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    const isEditing = !!editingRoute;

    const routeData: Partial<RouteFormDataType> = {
      ...formData,
      estimated_time_minutes: formData.estimated_time_minutes === '' ? null : formData.estimated_time_minutes,
      distance_km: formData.distance_km === '' ? null : formData.distance_km,
    };

    if (!isEditing) {
      delete routeData.id;
    }

    try {
      let response;
      let url = API_ENDPOINTS.ROUTES.LIST;

      if (isEditing) {
        url = API_ENDPOINTS.ROUTES.UPDATE(formData.id!);
        response = await apiService.put(url, routeData);
      } else {
        response = await apiService.post(url, routeData);
      }

      if (response.success) {
        alert(`Rota ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!`);
        closeModal();
        loadRoutes();
      } else {
        const errorMsg = response.error?.message || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} a rota.`;
        setError(errorMsg);
        console.error('Erro de API:', response.error);
      }
    } catch (err) {
      setError('Falha na comunicação com o servidor.');
      console.error('Erro na requisição:', err);
    } finally {
      setFormLoading(false);
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
            <button className="btn btn-primary" onClick={openCreateModal}>
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

                              <button
                                  className="btn btn-sm btn-outline-warning"
                                  title="Editar"
                                  onClick={() => openEditModal(route)}
                              >
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

        {/* Modal de Cadastro/Edição de Rotas */}
        {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div
                  className={`modal-content ${editingRoute ? 'editing' : 'creating'}`}
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>{editingRoute ? 'Editar Rota' : 'Nova Rota'}</h3>
                  <button className="modal-close" onClick={closeModal} disabled={formLoading}>
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}

                    <div className="form-group">
                      <label htmlFor="name">Nome da Rota *</label>
                      <input type="text" className="form-control" id="name" name="name"
                             value={formData.name} onChange={handleChange} required disabled={formLoading}
                             placeholder="Ex: Rota Centro Urbano 1"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Descrição</label>
                      <textarea className="form-control" id="description" name="description" rows={2}
                                value={formData.description} onChange={handleChange} disabled={formLoading}
                                placeholder="Detalhes sobre a rota, bairros cobertos, etc."
                      ></textarea>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="collection_type">Tipo de Coleta *</label>
                        <select className="form-control" id="collection_type" name="collection_type"
                                value={formData.collection_type} onChange={handleChange} required disabled={formLoading}
                        >
                          <option value="" disabled>Selecione</option>
                          {COLLECTION_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="priority">Prioridade *</label>
                        <select className="form-control" id="priority" name="priority"
                                value={formData.priority} onChange={handleChange} required disabled={formLoading}
                        >
                          <option value="" disabled>Selecione</option>
                          {PRIORITIES.map(p => (<option key={p} value={p}>{p}</option>))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="distance_km">Distância Estimada (Km)</label>
                        <input type="number" step="0.01" min="0" className="form-control" id="distance_km" name="distance_km"
                               value={formData.distance_km} onChange={handleChange} disabled={formLoading}
                               placeholder="Ex: 45.5 (em Km)"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="estimated_time_minutes">Tempo Estimado (Minutos)</label>
                        <input type="number" min="0" className="form-control" id="estimated_time_minutes" name="estimated_time_minutes"
                               value={formData.estimated_time_minutes} onChange={handleChange} disabled={formLoading}
                               placeholder="Ex: 180 (em minutos)"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="periodicity">Periodicidade *</label>
                        {/* CAMPO ALTERADO PARA SELECT/DROPDOWN */}
                        <select className="form-control" id="periodicity" name="periodicity"
                                value={formData.periodicity} onChange={handleChange} required disabled={formLoading}
                        >
                          <option value="" disabled>Selecione a frequência</option>
                          {PERIODICITIES.map(p => (<option key={p} value={p}>{p}</option>))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="active">Status</label>
                        <select className="form-control" id="active" name="active"
                                value={formData.active.toString()} onChange={handleChange} disabled={formLoading}
                        >
                          <option value="true">Ativa</option>
                          <option value="false">Inativa</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="notes">Observações</label>
                      <textarea className="form-control" id="notes" name="notes" rows={3}
                                value={formData.notes} onChange={handleChange} disabled={formLoading}
                                placeholder="Quaisquer notas relevantes para os operadores da rota."
                      ></textarea>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formLoading}>
                      <FaTimes /> Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={formLoading}>
                      {formLoading ? 'Salvando...' : (<><FaSave /> {editingRoute ? 'Atualizar' : 'Cadastrar'}</>)}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </Layout>
  );
};

export default RoutesPage;