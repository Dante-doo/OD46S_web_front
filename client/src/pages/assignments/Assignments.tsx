import React, { useState, useEffect } from 'react';
// Importa apenas os ícones necessários
import { FaPlus, FaEye, FaSave, FaTimes, FaEdit, FaBan } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import Pagination from '../../components/Pagination/Pagination';
import './Assignments.css';

interface RouteBasic {
  id: number;
  name: string;
  periodicity?: string;
  collectionType?: string;
  duration?: string;
  distance?: number;
}

interface DriverBasic {
  id: number;
  name: string;
  email: string;
  licenseNumber?: string;
  phone?: string;
}

interface VehicleBasic {
  id: number;
  licensePlate: string;
  model?: string;
  year?: number;
  brand?: string;
  capacityKg?: number;
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
  route_id: number;
  driver_id: number;
  vehicle_id: number;
  start_date: string;
  end_date: string;
}

interface AssignmentFormDataType {
  route_id: number | '';
  driver_id: number | '';
  vehicle_id: number | '';
  start_date: string;
  end_date: string;
  notes: string;
}

const INITIAL_FORM_DATA: AssignmentFormDataType = {
  route_id: '',
  driver_id: '',
  vehicle_id: '',
  start_date: '',
  end_date: '',
  notes: '',
};


const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormDataType>(INITIAL_FORM_DATA);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null); // Estado para visualização

  const [routes, setRoutes] = useState<RouteBasic[]>([]);
  const [drivers, setDrivers] = useState<DriverBasic[]>([]);
  const [vehicles, setVehicles] = useState<VehicleBasic[]>([]);

  // Paginação de assignments
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  // Estado de carregamento de rotas
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    loadAssignments();
    // Carrega drivers e veículos, mas não rotas (rotas serão carregadas apenas quando abrir o modal)
    loadDriversAndVehicles();
  }, [currentPage]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.ASSIGNMENTS.LIST}?page=${currentPage}&limit=${itemsPerPage}&sort=createdAt&order=desc`;
      const response = await apiService.get(url);
      
      if (response.success && response.data) {
        // O apiService já extrai data.data || data, então response.data já é o objeto { assignments: [...], pagination: {...} }
        const data = response.data;
        let assignmentsData: Assignment[] = [];
        
        // Tenta múltiplas formas de acessar os assignments
        if (data.assignments && Array.isArray(data.assignments)) {
          assignmentsData = data.assignments;
        } else if ((data as any)?.data?.assignments && Array.isArray((data as any).data.assignments)) {
          assignmentsData = (data as any).data.assignments;
        } else if (Array.isArray(data)) {
          assignmentsData = data;
        }
        
        const mappedAssignments = assignmentsData.map(a => ({
          ...a,
          route_id: a.route?.id || 0,
          driver_id: a.driver?.id || 0,
          vehicle_id: a.vehicle?.id || 0,
          start_date: a.start_date || (a.startDate ? (typeof a.startDate === 'string' ? a.startDate.split('T')[0] : '') : ''),
          end_date: a.end_date || (a.endDate ? (typeof a.endDate === 'string' ? a.endDate.split('T')[0] : '') : ''),
          startDate: a.start_date || a.startDate,
          endDate: a.end_date || a.endDate,
        }));
        setAssignments(mappedAssignments as Assignment[]);

        // Atualizar informações de paginação
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total_items || data.pagination.totalItems || data.pagination.total || assignmentsData.length);
        } else {
          setTotalPages(1);
          setTotalItems(assignmentsData.length);
        }
      } else {
        setAssignments([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
      setAssignments([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadRoutes = async () => {
    setRoutesLoading(true);
    try {
      const url = `${API_ENDPOINTS.ROUTES.LIST}?search=&page=1&limit=1000&sort=name&order=asc`;
      console.log('Carregando rotas da URL:', url);
      const response = await apiService.get(url);
      console.log('Resposta da API de rotas:', response);
      
      if (response.success && response.data) {
        let routesData: RouteBasic[] = [];
        const data = response.data.data || response.data;
        
        console.log('Dados recebidos:', data);
        
        // Tenta múltiplas formas de acessar as rotas (seguindo o padrão da página de rotas)
        let rawRoutes: any[] = [];
        if (data.routes && Array.isArray(data.routes)) {
          rawRoutes = data.routes;
        } else if (data.data?.routes && Array.isArray(data.data.routes)) {
          rawRoutes = data.data.routes;
        } else if (Array.isArray(data)) {
          rawRoutes = data;
        }
        
        // Mapeia os dados para o formato RouteBasic
        routesData = rawRoutes.map((route: any) => ({
          id: route.id,
          name: route.name || '',
          periodicity: route.periodicity || route.periodicity_cron || '',
          collectionType: route.collection_type || route.collectionType || '',
          duration: route.duration || route.estimated_time_minutes || '',
          distance: route.distance_km || route.distance || undefined,
        } as RouteBasic));
        
        console.log('Rotas processadas:', routesData);
        console.log('Quantidade de rotas:', routesData.length);
        setRoutes(routesData);
      } else {
        console.warn('Resposta da API não foi bem-sucedida:', response);
        setRoutes([]);
      }
    } catch (error) {
      console.error("Erro ao carregar rotas:", error);
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  const loadDriversAndVehicles = async () => {
    try {
      const driversResponse = await apiService.get(API_ENDPOINTS.USERS.LIST + '?type=DRIVER');
      if (driversResponse.success && driversResponse.data) {
        const driversData = driversResponse.data.users || driversResponse.data.data?.users || [];
        setDrivers(Array.isArray(driversData) ? driversData.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          licenseNumber: d.license_number
        })) : []);
      }
    } catch (e) { console.error("Erro ao carregar motoristas."); }

    try {
      const vehiclesResponse = await apiService.get(API_ENDPOINTS.VEHICLES.LIST);
      if (vehiclesResponse.success && vehiclesResponse.data) {
        let vehiclesData: any[] = [];

        if (Array.isArray(vehiclesResponse.data)) {
          vehiclesData = vehiclesResponse.data;
        } else if (vehiclesResponse.data.vehicles && Array.isArray(vehiclesResponse.data.vehicles)) {
          vehiclesData = vehiclesResponse.data.vehicles;
        } else if (vehiclesResponse.data.data && vehiclesResponse.data.data.vehicles && Array.isArray(vehiclesResponse.data.data.vehicles)) {
          vehiclesData = vehiclesResponse.data.data.vehicles;
        }

        setVehicles(vehiclesData.map(v => ({
          id: v.id,
          licensePlate: v.licensePlate || v.placa || 'N/A',
          model: v.model || v.modelo || 'N/A',
          year: v.year || v.ano,
        } as VehicleBasic)));
      }
    } catch (e) { console.error("Erro ao carregar veículos."); }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingAssignment(null);
    setRoutes([]);
  };

  const openCreateModal = () => {
    console.log('Abrindo modal de nova escala');
    resetForm();
    loadRoutes(); // Carrega todas as rotas (limit 1000) para nova escala
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleView = (assignment: Assignment) => {
    setViewingAssignment(assignment);
  };

  const closeViewModal = () => {
    setViewingAssignment(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let newValue: number | string = value;
    if (['route_id', 'driver_id', 'vehicle_id'].includes(name) && value !== '') {
      newValue = Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    } as AssignmentFormDataType));
  };

  const handleEdit = async (assignment: Assignment) => {
    setEditingAssignment(assignment);

    // Ao editar, mostra apenas a rota da escala sendo editada
    if (assignment.route) {
      setRoutes([assignment.route]);
    } else if (assignment.route_id) {
      // Se não tiver a rota completa, busca pelo ID
      try {
        const routeResponse = await apiService.get(API_ENDPOINTS.ROUTES.GET(assignment.route_id));
        if (routeResponse.success && routeResponse.data) {
          const routeData = routeResponse.data.route || routeResponse.data.data?.route || routeResponse.data;
          if (routeData) {
            setRoutes([routeData]);
          } else {
            // Fallback: cria um objeto básico com o ID
            setRoutes([{ id: assignment.route_id, name: `Rota ID: ${assignment.route_id}` } as RouteBasic]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar rota:', error);
        // Fallback: cria um objeto básico com o ID
        setRoutes([{ id: assignment.route_id, name: `Rota ID: ${assignment.route_id}` } as RouteBasic]);
      }
    } else {
      setRoutes([]);
    }

    setFormData({
      route_id: assignment.route_id,
      driver_id: assignment.driver_id,
      vehicle_id: assignment.vehicle_id,
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      notes: assignment.notes || '',
    });

    setShowModal(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja inativar esta escala? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await apiService.patch(API_ENDPOINTS.ASSIGNMENTS.DEACTIVATE(id), {});
      
      if (response.success) {
        alert('Escala inativada com sucesso!');
        loadAssignments();
      } else {
        alert(response.error?.message || 'Erro ao inativar escala');
      }
    } catch (error) {
      console.error('Erro ao inativar escala:', error);
      alert('Erro ao inativar escala');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (!formData.route_id || !formData.driver_id || !formData.vehicle_id) {
      alert('Por favor, selecione a Rota, Motorista e Veículo.');
      setFormLoading(false);
      return;
    }

    try {
      const isEditing = !!editingAssignment;
      let url = API_ENDPOINTS.ASSIGNMENTS.CREATE;
      let method = 'POST';
      let successMessage = 'Escala cadastrada com sucesso!';

      if (isEditing) {
        url = API_ENDPOINTS.ASSIGNMENTS.UPDATE(editingAssignment!.id);
        method = 'PUT';
        successMessage = 'Escala atualizada com sucesso!';
      }

      const dataToSend = {
        route_id: Number(formData.route_id),
        driver_id: Number(formData.driver_id),
        vehicle_id: Number(formData.vehicle_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes,
      };

      let response;
      if (method === 'PUT') {
        response = await apiService.put(url, dataToSend);
      } else {
        response = await apiService.post(url, dataToSend);
      }

      if (response.success) {
        alert(successMessage);
        closeModal();
        setCurrentPage(1); // Voltar para primeira página após criar/editar
        loadAssignments();
      } else {
        alert(response.error?.message || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} a escala.`);
        console.error('Erro de API:', response.error);
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor.');
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
        <div className="assignments-page">
          <div className="page-header">
            <h2>Gerenciamento de Escalas</h2>
            <button className="btn btn-primary" onClick={openCreateModal}>
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
                <th>Data Início</th>
                <th>Data Fim</th>
                <th>Ações</th>
              </tr>
              </thead>
              <tbody>
              {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      Nenhuma escala cadastrada
                    </td>
                  </tr>
              ) : (
                  assignments.map((assignment) => {
                    const routeName = assignment.route?.name || '-';
                    const driverName = assignment.driver?.name || '-';
                    const vehiclePlate = assignment.vehicle?.licensePlate || '-';

                    return (
                        <tr key={assignment.id}>
                          <td><strong>{routeName}</strong></td>
                          <td>{driverName}</td>
                          <td>{vehiclePlate}</td>
                          <td>{assignment.startDate ? new Date(assignment.startDate).toLocaleDateString('pt-BR') : '-'}</td>
                          <td>{assignment.endDate ? new Date(assignment.endDate).toLocaleDateString('pt-BR') : '-'}</td>
                          <td>
                            <div className="action-buttons">
                              {/* Botão Visualizar Detalhes */}
                              <button
                                  className="btn btn-sm btn-outline-primary"
                                  title="Ver detalhes da Escala"
                                  onClick={() => handleView(assignment)}
                              >
                                <FaEye />
                              </button>

                              <button
                                  className="btn btn-sm btn-outline-warning"
                                  title="Editar Escala"
                                  onClick={() => handleEdit(assignment)}
                              >
                                <FaEdit />
                              </button>

                              <button
                                  className="btn btn-sm btn-outline-danger"
                                  title="Inativar Escala"
                                  onClick={() => handleDeactivate(assignment.id)}
                              >
                                <FaBan />
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

          {/* Paginação */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>

        {viewingAssignment && (
            <div className="modal-overlay" onClick={closeViewModal}>
              <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Detalhes da Escala: #{viewingAssignment.id}</h3>
                  <button className="modal-close" onClick={closeViewModal}>
                    &times;
                  </button>
                </div>

                <div className="modal-body details-view">

                  <div className="details-section main-details">
                    <h4><strong>Informações da Escala</strong></h4>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>ID da Escala:</strong> {viewingAssignment.id}</p>
                        <p><strong>Início:</strong> {new Date(viewingAssignment.startDate!).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Fim:</strong> {new Date(viewingAssignment.endDate!).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <p><strong>Observações:</strong> {viewingAssignment.notes || 'Nenhuma'}</p>
                  </div>

                  <hr />

                  <div className="details-section sub-details">
                    <h4><strong>Detalhes da Rota</strong></h4>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Nome:</strong> {viewingAssignment.route?.name || 'N/A'}</p>
                        <p><strong>Periodicidade:</strong> {viewingAssignment.route?.periodicity || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Tipo de Coleta:</strong> {viewingAssignment.route?.collectionType || 'N/A'}</p>
                        <p><strong>Duração Estimada:</strong> {viewingAssignment.route?.duration || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="details-section sub-details">
                    <h4><strong>Detalhes do Motorista</strong></h4>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Nome:</strong> {viewingAssignment.driver?.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {viewingAssignment.driver?.email || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Telefone:</strong> {viewingAssignment.driver?.phone || 'N/A'}</p>
                        <p><strong>CNH:</strong> {viewingAssignment.driver?.licenseNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="details-section sub-details">
                    {/* Cor removida, apenas <h4> em negrito */}
                    <h4><strong>Detalhes do Veículo</strong></h4>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Placa:</strong> {viewingAssignment.vehicle?.licensePlate || 'N/A'}</p>
                        <p><strong>Marca/Modelo:</strong> {viewingAssignment.vehicle?.brand || 'N/A'} / {viewingAssignment.vehicle?.model || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Ano:</strong> {viewingAssignment.vehicle?.year || 'N/A'}</p>
                        <p><strong>Capacidade (kg):</strong> {viewingAssignment.vehicle?.capacityKg || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeViewModal}>
                    <FaTimes /> Fechar
                  </button>
                </div>
              </div>
            </div>
        )}

        {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingAssignment ? 'Editar Escala' : 'Nova Escala'}</h3>
                  <button className="modal-close" onClick={closeModal} disabled={formLoading}>
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">

                    <div className="form-group">
                      <label htmlFor="route_id">Rota *</label>
                      {editingAssignment ? (
                        // Ao editar: campo desabilitado mostrando apenas a rota da escala
                        <select
                            className="form-control"
                            id="route_id"
                            name="route_id"
                            value={formData.route_id}
                            disabled={true}
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        >
                          {routes.length > 0 ? (
                            routes.map(route => (
                              <option key={route.id} value={route.id}>
                                {route.name} ({route.collectionType || route.periodicity})
                              </option>
                            ))
                          ) : (
                            <option value={formData.route_id}>
                              Rota ID: {formData.route_id}
                            </option>
                          )}
                        </select>
                      ) : (
                        // Ao criar: campo habilitado com paginação
                        <>
                          <select
                              className="form-control"
                              id="route_id"
                              name="route_id"
                              value={formData.route_id}
                              onChange={handleFormChange}
                              required
                              disabled={formLoading || routesLoading}
                          >
                            <option value="">Selecione uma Rota</option>
                            {routes.map(route => (
                                <option key={route.id} value={route.id}>
                                  {route.name} ({route.collectionType || route.periodicity})
                                </option>
                            ))}
                          </select>
                          {routesLoading && <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>Carregando rotas...</small>}
                          {!routesLoading && routes.length === 0 && <small className="text-muted text-danger" style={{ display: 'block', marginTop: '0.5rem' }}>Nenhuma rota disponível.</small>}
                          {!routesLoading && routes.length > 0 && (
                            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>
                              {routes.length} rota{routes.length !== 1 ? 's' : ''} disponível{routes.length !== 1 ? 'eis' : ''}
                            </small>
                          )}
                        </>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver_id">Motorista *</label>
                      <select
                          className="form-control"
                          id="driver_id"
                          name="driver_id"
                          value={formData.driver_id}
                          onChange={handleFormChange}
                          required
                          disabled={formLoading}
                      >
                        <option value="">Selecione um Motorista</option>
                        {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.email})
                            </option>
                        ))}
                      </select>
                      {drivers.length === 0 && <small className="text-muted text-danger">Nenhum motorista disponível.</small>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="vehicle_id">Veículo *</label>
                      <select
                          className="form-control"
                          id="vehicle_id"
                          name="vehicle_id"
                          value={formData.vehicle_id}
                          onChange={handleFormChange}
                          required
                          disabled={formLoading}
                      >
                        <option value="">Selecione um Veículo</option>
                        {vehicles.map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.licensePlate} ({vehicle.model || 'N/A'})
                            </option>
                        ))}
                      </select>
                      {vehicles.length === 0 && <small className="text-muted text-danger">Nenhum veículo disponível.</small>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="start_date">Data Início *</label>
                        <input
                            type="date"
                            className="form-control"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleFormChange}
                            required
                            disabled={formLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="end_date">Data Fim *</label>
                        <input
                            type="date"
                            className="form-control"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleFormChange}
                            required
                            disabled={formLoading}
                        />
                      </div>
                    </div>

                    {/* Notas/Observações */}
                    <div className="form-group">
                      <label htmlFor="notes">Observações</label>
                      <textarea
                          className="form-control"
                          id="notes"
                          name="notes"
                          rows={2}
                          value={formData.notes}
                          onChange={handleFormChange}
                          disabled={formLoading}
                          placeholder="Notas importantes sobre esta escala."
                      ></textarea>
                    </div>

                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formLoading}>
                      <FaTimes /> Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={formLoading}>
                      {formLoading
                          ? 'Salvando...'
                          : (<><FaSave /> {editingAssignment ? 'Atualizar' : 'Cadastrar'}</>)
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </Layout>
  );
};

export default Assignments;