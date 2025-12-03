import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './Vehicles.css';

interface Vehicle {
  id: number;
  licensePlate?: string;
  placa?: string; // Fallback para compatibilidade
  model?: string;
  modelo?: string; // Fallback
  brand?: string;
  marca?: string; // Fallback
  year?: number;
  ano?: number; // Fallback
  capacityKg?: number;
  capacidade?: number; // Fallback
  fuelType?: string;
  averageConsumption?: number;
  status?: string;
  currentKm?: number;
  acquisitionDate?: string;
  notes?: string;
  active?: boolean;
}

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    marca: '',
    ano: new Date().getFullYear(),
    cor: '',
    capacidade: 0,
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.VEHICLES.LIST);
      console.log('Resposta completa da API:', response);
      
      if (response.success && response.data) {
        // O backend retorna uma lista diretamente (ResponseEntity<List<VeiculoDTO>>)
        // O apiService já faz data.data || data, então se for lista direta, response.data será a lista
        let vehiclesList: Vehicle[] = [];
        
        if (Array.isArray(response.data)) {
          // Se response.data já é um array, usar diretamente
          vehiclesList = response.data;
        } else if (response.data.vehicles && Array.isArray(response.data.vehicles)) {
          vehiclesList = response.data.vehicles;
        } else if (response.data.data && response.data.data.vehicles && Array.isArray(response.data.data.vehicles)) {
          vehiclesList = response.data.data.vehicles;
        }
        
        console.log('Veículos processados:', vehiclesList);
        setVehicles(vehiclesList);
      } else {
        console.error('Erro ao carregar veículos:', response.error);
        setVehicles([]);
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Converter dados do formulário para o formato esperado pelo backend
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

      if (editingVehicle) {
        const response = await apiService.put(
          API_ENDPOINTS.VEHICLES.UPDATE(editingVehicle.id),
          vehicleData
        );
        if (response.success) {
          alert('Caminhão atualizado com sucesso!');
          setShowModal(false);
          resetForm();
          loadVehicles();
        } else {
          alert(response.error?.message || 'Erro ao atualizar caminhão');
        }
      } else {
        const response = await apiService.post(API_ENDPOINTS.VEHICLES.CREATE, vehicleData);
        if (response.success) {
          alert('Caminhão cadastrado com sucesso!');
          setShowModal(false);
          resetForm();
          loadVehicles();
        } else {
          alert(response.error?.message || 'Erro ao cadastrar caminhão');
        }
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
      cor: '', // Backend não retorna cor, manter vazio ou adicionar ao backend
      capacidade: vehicle.capacityKg ? Number(vehicle.capacityKg) : (vehicle.capacidade || 0),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este caminhão?')) return;
    // Note: Backend doesn't have DELETE endpoint for vehicles, so we'll just show a message
    alert('Funcionalidade de exclusão não disponível no momento');
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      // Converter status para o formato do enum do backend
      let statusEnum = newStatus;
      if (newStatus === 'ATIVO') {
        statusEnum = 'AVAILABLE';
      } else if (newStatus === 'INATIVO') {
        statusEnum = 'INACTIVE';
      }
      
      // O backend espera status como query parameter
      const url = `${API_ENDPOINTS.VEHICLES.STATUS(id)}?status=${statusEnum}`;
      const response = await apiService.patch(url, {});
      
      if (response.success) {
        loadVehicles();
      } else {
        alert(response.error?.message || 'Erro ao alterar status');
      }
    } catch (error) {
      alert('Erro ao alterar status');
    }
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
                  const capacidade = vehicle.capacityKg ? Number(vehicle.capacityKg).toFixed(2) : (vehicle.capacidade || '-');
                  const status = vehicle.status || 'UNKNOWN';
                  const statusClass = status === 'AVAILABLE' || status === 'ATIVO' || status === 'ACTIVE' 
                    ? 'bg-success' 
                    : status === 'IN_USE' || status === 'IN_MAINTENANCE'
                    ? 'bg-warning'
                    : 'bg-secondary';
                  
                  return (
                  <tr key={vehicle.id}>
                    <td><strong>{placa}</strong></td>
                    <td>{modelo}</td>
                    <td>{marca}</td>
                    <td>{ano}</td>
                    <td>-</td>
                    <td>{capacidade}</td>
                    <td>
                      <span className={`badge ${statusClass}`}>
                        {status}
                      </span>
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
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(vehicle.id)}
                          title="Excluir"
                        >
                          <FaTrash />
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

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingVehicle ? 'Editar Caminhão' : 'Novo Caminhão'}</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
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
      </div>
    </Layout>
  );
};

export default Vehicles;

