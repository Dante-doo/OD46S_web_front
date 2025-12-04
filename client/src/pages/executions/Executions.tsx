import React, { useState, useEffect } from 'react';
import { FaEye, FaChartLine, FaTimes, FaMapMarkerAlt, FaClock, FaRoute, FaMap } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface GPSRecord {
  id: number;
  execution_id: number;
  gps_timestamp: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading_degrees?: number;
  accuracy_meters?: number;
  event_type: string;
  is_automatic: boolean;
  is_offline: boolean;
  description?: string;
  point_id?: number;
  collected_weight_kg?: number;
  point_condition?: string;
  photo_url?: string;
}

interface GPSTraceData {
  execution_id: number;
  gps_track: GPSRecord[];
  statistics: {
    total_points: number;
    first_timestamp?: string;
    last_timestamp?: string;
    total_distance_km?: number;
  };
}

const Executions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'executions' | 'map'>(
    location.pathname === '/reports/map' ? 'map' : 'executions'
  );
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [gpsTrace, setGpsTrace] = useState<GPSTraceData | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);

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

  const loadGpsTrace = async (executionId: number) => {
    setLoadingGps(true);
    setShowGpsModal(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.EXECUTIONS.GPS(executionId));
      if (response.success && response.data) {
        // A resposta vem como { success: true, data: { gps_track: [...], statistics: {...}, execution_id: ... } }
        const traceData: GPSTraceData = {
          execution_id: response.data.execution_id || executionId,
          gps_track: response.data.gps_track || [],
          statistics: response.data.statistics || { total_points: 0 }
        };
        setGpsTrace(traceData);
      } else {
        alert('Erro ao carregar rastro GPS: ' + (response.error?.message || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro ao carregar rastro GPS: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoadingGps(false);
    }
  };

  const handleViewDetails = (execution: Execution) => {
    setSelectedExecution(execution);
    loadGpsTrace(execution.id);
  };

  const closeGpsModal = () => {
    setShowGpsModal(false);
    setGpsTrace(null);
    setSelectedExecution(null);
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
          <h2>Relatórios</h2>
          <div className="header-actions">
            <button className="btn btn-outline-primary">
              <FaChartLine /> Gerar Relatório
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="reports-tabs">
          <button
            className={`tab-button ${activeTab === 'executions' ? 'active' : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            <FaChartLine /> Execuções
          </button>
          <button
            className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => navigate('/reports/map')}
          >
            <FaMap /> Mapa de Rotas
          </button>
        </div>

        {activeTab === 'map' && (
          <div className="tab-content">
            <div className="alert alert-info">
              <FaMap /> <strong>Redirecionando para o Mapa de Rotas...</strong>
            </div>
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="tab-content">

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
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        title="Ver rastro GPS"
                        onClick={() => handleViewDetails(execution)}
                      >
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
        )}

      {/* Modal de Rastro GPS */}
      {showGpsModal && (
        <div className="modal-overlay" onClick={closeGpsModal}>
          <div className="modal-content gps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaRoute /> Rastro GPS - Execução #{selectedExecution?.id}
              </h3>
              <button className="btn-close" onClick={closeGpsModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {loadingGps ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                  <p className="mt-2">Carregando rastro GPS...</p>
                </div>
              ) : gpsTrace ? (
                <>
                  {/* Estatísticas */}
                  <div className="gps-statistics mb-4">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="stat-card">
                          <FaMapMarkerAlt className="stat-icon" />
                          <div className="stat-value">{gpsTrace.statistics.total_points}</div>
                          <div className="stat-label">Pontos GPS</div>
                        </div>
                      </div>
                      {gpsTrace.statistics.total_distance_km && (
                        <div className="col-md-3">
                          <div className="stat-card">
                            <FaRoute className="stat-icon" />
                            <div className="stat-value">{gpsTrace.statistics.total_distance_km.toFixed(2)}</div>
                            <div className="stat-label">Distância (km)</div>
                          </div>
                        </div>
                      )}
                      {gpsTrace.statistics.first_timestamp && (
                        <div className="col-md-3">
                          <div className="stat-card">
                            <FaClock className="stat-icon" />
                            <div className="stat-value-small">
                              {new Date(gpsTrace.statistics.first_timestamp).toLocaleTimeString('pt-BR')}
                            </div>
                            <div className="stat-label">Início</div>
                          </div>
                        </div>
                      )}
                      {gpsTrace.statistics.last_timestamp && (
                        <div className="col-md-3">
                          <div className="stat-card">
                            <FaClock className="stat-icon" />
                            <div className="stat-value-small">
                              {new Date(gpsTrace.statistics.last_timestamp).toLocaleTimeString('pt-BR')}
                            </div>
                            <div className="stat-label">Fim</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de registros GPS */}
                  <div className="gps-records-container">
                    <h5 className="mb-3">Registros GPS ({gpsTrace.gps_track.length})</h5>
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Timestamp</th>
                            <th>Lat/Lng</th>
                            <th>Evento</th>
                            <th>Velocidade</th>
                            <th>Ponto</th>
                            <th>Peso (kg)</th>
                            <th>Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gpsTrace.gps_track.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-muted">
                                Nenhum registro GPS encontrado
                              </td>
                            </tr>
                          ) : (
                            gpsTrace.gps_track.map((record) => (
                              <tr key={record.id}>
                                <td>
                                  {new Date(record.gps_timestamp).toLocaleString('pt-BR')}
                                  {record.is_offline && (
                                    <span className="badge bg-secondary ms-1" title="Sincronizado offline">
                                      Offline
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <small>
                                    {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                                  </small>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    record.event_type === 'POINT_COLLECTED' ? 'bg-success' :
                                    record.event_type === 'PROBLEM' ? 'bg-danger' :
                                    record.event_type === 'START' ? 'bg-primary' :
                                    record.event_type === 'END' ? 'bg-info' :
                                    'bg-secondary'
                                  }`}>
                                    {record.event_type}
                                  </span>
                                </td>
                                <td>
                                  {record.speed_kmh ? `${record.speed_kmh.toFixed(1)} km/h` : '-'}
                                </td>
                                <td>
                                  {record.point_id ? `#${record.point_id}` : '-'}
                                </td>
                                <td>
                                  {record.collected_weight_kg ? `${record.collected_weight_kg.toFixed(1)}` : '-'}
                                </td>
                                <td>
                                  {record.description ? (
                                    <small title={record.description}>
                                      {record.description.length > 30 
                                        ? record.description.substring(0, 30) + '...' 
                                        : record.description}
                                    </small>
                                  ) : '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-muted">
                  Nenhum dado disponível
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeGpsModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default Executions;

