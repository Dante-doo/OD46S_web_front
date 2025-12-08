import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import Pagination from '../../components/Pagination/Pagination';
import './Vehicles.css';

interface Vehicle {
  id: number;
  licensePlate?: string;
  placa?: string;
  model?: string;
  modelo?: string;
  brand?: string;
  marca?: string;
  year?: number;
  ano?: number;
  capacityKg?: number;
  capacidade?: number;
  fuelType?: string;
  averageConsumption?: number;
  status?: string;
  currentKm?: number;
  acquisitionDate?: string;
  notes?: string;
  active?: boolean;
}

interface FormData {
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  cor: string;
  capacidade: number;
}

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<FormData>({
    placa: '',
    modelo: '',
    marca: '',
    ano: new Date().getFullYear(),
    cor: '',
    capacidade: 0,
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadVehicles();
  }, [currentPage]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.VEHICLES.LIST}?page=${currentPage}&limit=${itemsPerPage}&sort=licensePlate&order=asc`;
      const response = await apiService.get(url);
      console.log('Resposta completa da API:', response);

      if (response.success) {
        let vehiclesList: Vehicle[] = [];
        let paginationData = null;

        // Verificar se é resposta paginada ou lista simples
        if (response.data && response.data.data) {
          // Resposta paginada: { success: true, data: { vehicles: [], pagination: {} } }
          const data = response.data.data;
          if (data.vehicles && Array.isArray(data.vehicles)) {
            vehiclesList = data.vehicles;
          }
          paginationData = data.pagination;
        } else if (response.data && Array.isArray(response.data)) {
          // Lista simples: { success: true, data: [] }
          vehiclesList = response.data;
          paginationData = null;
        } else if (response.data && response.data.vehicles) {
          // Formato alternativo: { success: true, data: { vehicles: [] } }
          vehiclesList = Array.isArray(response.data.vehicles) ? response.data.vehicles : [];
          paginationData = response.data.pagination;
        }

        console.log('Veículos processados:', vehiclesList);
        setVehicles(vehiclesList);

        // Atualizar informações de paginação
        if (paginationData) {
          setTotalPages(paginationData.total_pages || paginationData.totalPages || 1);
          setTotalItems(paginationData.total || paginationData.total_items || paginationData.totalItems || vehiclesList.length);
        } else {
          // Se não houver paginação, assumir que todos os itens foram retornados
          setTotalPages(1);
          setTotalItems(vehiclesList.length);
        }
      } else {
        console.error('Erro ao carregar veículos:', response.error);
        setVehicles([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setVehicles([]);
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


  const resetForm = () => {
    setFormData({
      placa: '',
      modelo: '',
      marca: '',
      ano: new Date().getFullYear(),
      cor: '',
      capacidade: 0,
    });
    setEditingVehicle(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleData = {
        licensePlate: formData.placa,
        model: formData.modelo,
        brand: formData.marca,
        year: formData.ano,
        capacityKg: formData.capacidade,
        // Campos opcionais
        fuelType: 'DIESEL',
        averageConsumption: 0,
        status: 'AVAILABLE',
        active: true,
      };

      let response;
      if (editingVehicle) {
        response = await apiService.put(
            API_ENDPOINTS.VEHICLES.UPDATE(editingVehicle.id),
            vehicleData
        );
      } else {
        response = await apiService.post(API_ENDPOINTS.VEHICLES.CREATE, vehicleData);
      }

      if (response.success) {
        alert(`Caminhão ${editingVehicle ? 'atualizado' : 'cadastrado'} com sucesso!`);
        setShowModal(false);
        resetForm();
        loadVehicles();
      } else {
        alert(response.error?.message || `Erro ao ${editingVehicle ? 'atualizar' : 'cadastrar'} caminhão`);
      }
    } catch (error) {
      alert('Erro ao salvar caminhão');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      placa: vehicle.licensePlate || vehicle.placa || '',
      modelo: vehicle.model || vehicle.modelo || '',
      marca: vehicle.brand || vehicle.marca || '',
      ano: vehicle.year || vehicle.ano || new Date().getFullYear(),
      cor: '',
      capacidade: vehicle.capacityKg ? Number(vehicle.capacityKg) : (vehicle.capacidade || 0),
    });
    setShowModal(true);
  };


  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      let statusEnum = newStatus;
      if (newStatus === 'ATIVO') {
        statusEnum = 'AVAILABLE';
      } else if (newStatus === 'INATIVO') {
        statusEnum = 'INACTIVE';
      }

      const url = `${API_ENDPOINTS.VEHICLES.STATUS(id)}?status=${statusEnum}`;
      const response = await apiService.patch(url, {});

      if (response.success) {
        setCurrentPage(1); // Voltar para primeira página após criar/editar
        loadVehicles();
      } else {
        alert(response.error?.message || 'Erro ao alterar status');
      }
    } catch (error) {
      alert('Erro ao alterar status');
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
        <div className="vehicles-page">
          <div className="page-header">
            <h2>Gerenciamento de Caminhões</h2>
            <button className="btn btn-primary" onClick={openModal}>
              <FaPlus /> Novo Caminhão
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Ano</th>
                <th>Cor</th>
                <th>Capacidade (kg)</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
              </thead>
              <tbody>
              {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      Nenhum caminhão cadastrado
                    </td>
                  </tr>
              ) : (
                  vehicles.map((vehicle) => {
                    const placa = vehicle.licensePlate || vehicle.placa || '-';
                    const modelo = vehicle.model || vehicle.modelo || '-';
                    const marca = vehicle.brand || vehicle.marca || '-';
                    const ano = vehicle.year || vehicle.ano || '-';
                    const capacidade = vehicle.capacityKg
                        ? Number(vehicle.capacityKg).toFixed(2)
                        : vehicle.capacidade || '-';
                    const status = vehicle.status || 'UNKNOWN';

                    const statusClass =
                        status === 'AVAILABLE' || status === 'ATIVO' || status === 'ACTIVE'
                            ? 'bg-success'
                            : status === 'IN_USE' || status === 'IN_MAINTENANCE'
                                ? 'bg-warning'
                                : 'bg-secondary';

                    return (
                        <tr key={vehicle.id}>
                          <td>
                            <strong>{placa}</strong>
                          </td>
                          <td>{modelo}</td>
                          <td>{marca}</td>
                          <td>{ano}</td>
                          <td>-</td>
                          <td>{capacidade}</td>
                          <td>
                            <span className={`badge ${statusClass}`}>{status}</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEdit(vehicle)}
                                  title="Editar"
                              >
                                <FaEdit />
                              </button>

                              {(status === 'AVAILABLE' || status === 'ACTIVE' || status === 'ATIVO') ? (
                                  <button
                                      className="btn btn-sm btn-outline-warning"
                                      onClick={() => handleStatusChange(vehicle.id, 'INACTIVE')}
                                      title="Desativar"
                                  >
                                    <FaTimesCircle />
                                  </button>
                              ) : (
                                  <button
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => handleStatusChange(vehicle.id, 'AVAILABLE')}
                                      title="Ativar"
                                  >
                                    <FaCheckCircle />
                                  </button>
                              )}
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

        {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div
                  className={`modal-content ${editingVehicle ? 'editing' : 'creating'}`}
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>{editingVehicle ? 'Editar Caminhão' : 'Novo Caminhão'}</h3>
                  <button className="modal-close" onClick={closeModal}>
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Placa *</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.placa}
                          onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                          required
                          maxLength={7}
                      />
                    </div>
                    <div className="form-group">
                      <label>Marca *</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.marca}
                          onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Modelo *</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.modelo}
                          onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                          required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Ano *</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.ano}
                            onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                            required
                            min={1900}
                            max={new Date().getFullYear() + 1}
                        />
                      </div>
                      <div className="form-group">
                        <label>Cor *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.cor}
                            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                            required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Capacidade (kg) *</label>
                      <input
                          type="number"
                          className="form-control"
                          value={formData.capacidade}
                          onChange={(e) => setFormData({ ...formData, capacidade: parseFloat(e.target.value) })}
                          required
                          min={0}
                          step="0.01"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingVehicle ? 'Atualizar' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </Layout>
  );
};

export default Vehicles;