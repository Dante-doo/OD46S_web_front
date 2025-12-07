import React, { useState, useEffect } from 'react';
// Importa apenas os ícones necessários
import { FaPlus, FaEye, FaSave, FaTimes, FaEdit } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
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
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
  start_date: string;
  end_date: string;
  notes: string;
}

const INITIAL_FORM_DATA: AssignmentFormDataType = {
  route_id: '',
  driver_id: '',
  vehicle_id: '',
  status: 'SCHEDULED',
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


  useEffect(() => {
    loadAssignments();
    loadExternalData();
  }, []);


  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.ASSIGNMENTS.LIST);
      if (response.success && response.data) {
        let assignmentsData: Assignment[] = [];
        if (response.data.assignments && Array.isArray(response.data.assignments)) {
          assignmentsData = response.data.assignments;
        } else if (response.data.data && response.data.data.assignments && Array.isArray(response.data.data.assignments)) {
          assignmentsData = response.data.data.assignments;
        } else if (Array.isArray(response.data)) {
          assignmentsData = response.data;
        }

        const mappedAssignments = assignmentsData.map(a => ({
          ...a,
          route_id: a.route?.id || 0,
          driver_id: a.driver?.id || 0,
          vehicle_id: a.vehicle?.id || 0,
          start_date: a.startDate ? a.startDate.split('T')[0] : '',
          end_date: a.endDate ? a.endDate.split('T')[0] : '',
        }));

        setAssignments(mappedAssignments as Assignment[]);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExternalData = async () => {
    try {
      const routesResponse = await apiService.get(API_ENDPOINTS.ROUTES.LIST);
      if (routesResponse.success && routesResponse.data) {
        const routesData = routesResponse.data.routes || routesResponse.data.data?.routes || [];
        setRoutes(Array.isArray(routesData) ? routesData : []);
      }
    } catch (e) { console.error("Erro ao carregar rotas."); }

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
  };

  const openCreateModal = () => {
    resetForm();
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

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);

    setFormData({
      route_id: assignment.route_id,
      driver_id: assignment.driver_id,
      vehicle_id: assignment.vehicle_id,
      status: assignment.status as AssignmentFormDataType['status'],
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      notes: assignment.notes || '',
    });

    setShowModal(true);
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
        ...formData,
        route_id: Number(formData.route_id),
        driver_id: Number(formData.driver_id),
        vehicle_id: Number(formData.vehicle_id),
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success';
      case 'SCHEDULED': return 'bg-success';
      case 'COMPLETED': return 'bg-primary';
      case 'CANCELED': return 'bg-danger';
      default: return 'bg-light text-dark';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'ATIVA';
      case 'SCHEDULED': return 'AGENDADA';
      case 'COMPLETED': return 'CONCLUÍDA';
      case 'CANCELED': return 'DESATIVADA';
      default: return status;
    }
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
                    const routeName = assignment.route?.name || '-';
                    const driverName = assignment.driver?.name || '-';
                    const vehiclePlate = assignment.vehicle?.licensePlate || '-';
                    const status = assignment.status || 'UNKNOWN';
                    const badgeClass = getStatusBadgeClass(status);

                    return (
                        <tr key={assignment.id}>
                          <td><strong>{routeName}</strong></td>
                          <td>{driverName}</td>
                          <td>{vehiclePlate}</td>
                          <td>
                      <span className={`badge ${badgeClass}`}>
                        {getStatusText(status)}
                      </span>
                          </td>
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
                        <p><strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(viewingAssignment.status)}`}>{getStatusText(viewingAssignment.status)}</span></p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Início:</strong> {new Date(viewingAssignment.startDate!).toLocaleDateString('pt-BR')}</p>
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
                      <select
                          className="form-control"
                          id="route_id"
                          name="route_id"
                          value={formData.route_id}
                          onChange={handleFormChange}
                          required
                          disabled={formLoading}
                      >
                        <option value="">Selecione uma Rota</option>
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>
                              {route.name} ({route.collectionType || route.periodicity})
                            </option>
                        ))}
                      </select>
                      {routes.length === 0 && <small className="text-muted text-danger">Nenhuma rota disponível.</small>}
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

                    <div className="form-group">
                      <label htmlFor="status">Status *</label>
                      <select
                          className="form-control"
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                          required
                          disabled={formLoading}
                      >
                        <option value="SCHEDULED">Agendada</option>
                        <option value="ACTIVE">Em Andamento</option>
                        <option value="COMPLETED">Concluída</option>
                        <option value="CANCELED">Cancelada</option>
                      </select>
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