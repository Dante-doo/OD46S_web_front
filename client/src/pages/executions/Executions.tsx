import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaEye, FaChartLine, FaTimes, FaMapMarkerAlt, FaClock, FaRoute, FaMap } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
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
  executionId?: number;
  execution_id?: number; // Fallback
  gpsTimestamp?: string; // Backend retorna em camelCase
  gps_timestamp?: string; // Fallback
  latitude: number | string;
  longitude: number | string;
  speedKmh?: number | string;
  speed_kmh?: number | string; // Fallback
  headingDegrees?: number;
  heading_degrees?: number; // Fallback
  accuracyMeters?: number;
  accuracy_meters?: number; // Fallback
  eventType?: string; // Backend retorna em camelCase
  event_type?: string; // Fallback
  isAutomatic?: boolean;
  is_automatic?: boolean; // Fallback
  isOffline?: boolean;
  is_offline?: boolean; // Fallback
  description?: string;
  pointId?: number;
  point_id?: number; // Fallback
  pointCondition?: string;
  point_condition?: string; // Fallback
  photoUrl?: string;
  photo_url?: string; // Fallback
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
        const gpsTrack = response.data.gps_track || [];
        
        // Log para debug (apenas em desenvolvimento)
        if (gpsTrack.length > 0) {
          console.log('Primeiro registro GPS:', gpsTrack[0]);
        }
        
        const traceData: GPSTraceData = {
          execution_id: response.data.execution_id || executionId,
          gps_track: gpsTrack,
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
                <th>Rota</th>
                <th>Motorista</th>
                <th>Status</th>
                <th>Início</th>
                <th>Fim</th>
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
                    <td>{execution.assignment?.route?.name || execution.route?.name || '-'}</td>
                    <td>{execution.assignment?.driver?.name || execution.driverName || '-'}</td>
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
                    <td>
                      <div className="action-buttons-group">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          title="Ver rastro GPS"
                          onClick={() => handleViewDetails(execution)}
                        >
                          <FaEye />
                        </button>
                        <Link
                          to={`/execution-reports?executionId=${execution.id}`}
                          className="btn btn-sm btn-outline-success"
                          title="Ver relatório completo"
                        >
                          <FaChartLine />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </div>
        )}

      {/* Modal de Rastro GPS - Renderizado via Portal para evitar corte */}
      {showGpsModal && createPortal(
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
                            <th>Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gpsTrace.gps_track.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted">
                                Nenhum registro GPS encontrado
                              </td>
                            </tr>
                          ) : (
                            gpsTrace.gps_track.map((record) => {
                              // Normalizar campos (backend pode retornar camelCase ou snake_case)
                              const timestamp = record.gpsTimestamp || record.gps_timestamp;
                              const eventType = record.eventType || record.event_type || 'NORMAL';
                              const speedKmhRaw = record.speedKmh !== undefined ? record.speedKmh : record.speed_kmh;
                              const isOffline = record.isOffline !== undefined ? record.isOffline : (record.is_offline || false);
                              
                              // Converter latitude e longitude (podem vir como string, number ou BigDecimal)
                              const latRaw = record.latitude;
                              const lngRaw = record.longitude;
                              const lat = latRaw !== null && latRaw !== undefined 
                                ? (typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw))
                                : null;
                              const lng = lngRaw !== null && lngRaw !== undefined
                                ? (typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw))
                                : null;
                              
                              // Converter velocidade (pode vir como string, number ou BigDecimal)
                              const speedKmh = speedKmhRaw !== null && speedKmhRaw !== undefined
                                ? (typeof speedKmhRaw === 'string' ? parseFloat(speedKmhRaw) : Number(speedKmhRaw))
                                : null;
                              
                              // Tentar parsear timestamp em diferentes formatos
                              let timestampDisplay = 'N/A';
                              
                              if (timestamp) {
                                try {
                                  // Backend retorna LocalDateTime como ISO-8601 string (ex: "2025-01-15T08:15:00")
                                  // Spring Boot serializa LocalDateTime como "YYYY-MM-DDTHH:mm:ss" (sem timezone)
                                  let dateStr = String(timestamp).trim();
                                  
                                  // Se não tem timezone, trata como hora local do servidor
                                  // Formato esperado: "2025-01-15T08:15:00" ou "2025-01-15T08:15:00.123"
                                  let dateObj: Date;
                                  
                                  if (dateStr.includes('T')) {
                                    // Formato ISO-8601
                                    // Se não tem timezone, assume que é hora local (não adiciona Z)
                                    dateObj = new Date(dateStr);
                                    
                                    // Verifica se o parse foi bem-sucedido
                                    if (isNaN(dateObj.getTime())) {
                                      // Tenta adicionar timezone se não funcionou
                                      if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
                                        dateObj = new Date(dateStr + 'Z');
                                      } else {
                                        throw new Error('Invalid date format');
                                      }
                                    }
                                  } else {
                                    // Formato não reconhecido, tenta parsear direto
                                    dateObj = new Date(dateStr);
                                  }
                                  
                                  if (!isNaN(dateObj.getTime())) {
                                    timestampDisplay = dateObj.toLocaleString('pt-BR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    });
                                  } else {
                                    // Se ainda falhar, mostra o valor original
                                    timestampDisplay = dateStr;
                                  }
                                } catch (e) {
                                  // Em caso de erro, mostra o valor original
                                  timestampDisplay = String(timestamp);
                                }
                              }
                              
                              return (
                                <tr key={record.id}>
                                  <td>
                                    {timestampDisplay}
                                    {isOffline && (
                                      <span className="badge bg-secondary ms-1" title="Sincronizado offline">
                                        Offline
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <small>
                                      {lat ? lat.toFixed(6) : 'N/A'}, {lng ? lng.toFixed(6) : 'N/A'}
                                    </small>
                                  </td>
                                  <td>
                                    {eventType ? (
                                      <span className={`badge ${
                                        eventType === 'POINT_COLLECTED' ? 'bg-success' :
                                        eventType === 'PROBLEM' || eventType === 'POINT_PROBLEM' ? 'bg-danger' :
                                        eventType === 'START' ? 'bg-primary' :
                                        eventType === 'END' ? 'bg-info' :
                                        eventType === 'NORMAL' ? 'bg-secondary' :
                                        eventType === 'STOP' ? 'bg-warning' :
                                        eventType === 'BREAK' ? 'bg-warning' :
                                        'bg-secondary'
                                      }`}>
                                        {eventType}
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary">N/A</span>
                                    )}
                                  </td>
                                  <td>
                                    {speedKmh !== null && speedKmh !== undefined && !isNaN(speedKmh) ? `${speedKmh.toFixed(1)} km/h` : '-'}
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
                              );
                            })
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
        </div>,
        document.body
      )}
      </div>
    </Layout>
  );
};

export default Executions;

