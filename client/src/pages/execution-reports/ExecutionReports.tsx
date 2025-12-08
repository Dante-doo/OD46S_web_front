import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, Marker, useMap, Popup } from 'react-leaflet';
import { FaChartLine, FaMap, FaRoute, FaCheckCircle, FaInfoCircle, FaArrowLeft, FaUser, FaRoad } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import 'leaflet/dist/leaflet.css';
import './ExecutionReports.css';

// Fix para ícones do Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Execution {
  id: number;
  assignmentId?: number;
  assignment?: {
    id: number;
    route?: {
      id: number;
      name: string;
      collection_type?: string;
      collectionType?: string;
    };
    driver?: {
      id: number;
      name: string;
      email?: string;
    };
  };
  routeId?: number;
  route?: {
    id: number;
    name: string;
    collection_type?: string;
    collectionType?: string;
  };
  driverName?: string;
  driver?: {
    id: number;
    name: string;
    email?: string;
  };
  status: string;
  execution_date?: string;
  startTime?: string;
  endTime?: string;
  points_visited?: number;
  points_collected?: number;
  totalDistance?: number;
}

interface GPSRecord {
  id: number;
  execution_id: number;
  gps_timestamp: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  event_type: string;
  point_id?: number;
}

interface CollectionPoint {
  id: number;
  sequence_order: number;
  latitude: number;
  longitude: number;
  address: string;
}

interface RouteArea {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties?: any;
}

// Componente para ajustar o zoom do mapa
function MapBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

const ExecutionReports: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const executionIdParam = searchParams.get('executionId');
  
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // Dados da execução
  const [gpsTrack, setGpsTrack] = useState<GPSRecord[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [routeAreas, setRouteAreas] = useState<RouteArea[]>([]);
  
  // Cálculos
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [streetsInPolygon, setStreetsInPolygon] = useState<any[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(false);

  useEffect(() => {
    loadExecutions();
  }, []);

  // Selecionar execução automaticamente se vier da URL
  useEffect(() => {
    if (executionIdParam && executions.length > 0) {
      const execId = Number(executionIdParam);
      const exec = executions.find(e => e.id === execId);
      if (exec) {
        setSelectedExecution(exec);
      }
    }
  }, [executionIdParam, executions]);

  useEffect(() => {
    if (selectedExecution) {
      loadExecutionData();
    } else {
      // Resetar dados quando não há execução selecionada
      setGpsTrack([]);
      setRouteData(null);
      setCollectionPoints([]);
      setRouteAreas([]);
      setCompletionPercentage(0);
      setMapBounds(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExecution]);

  // Carregar ruas do polígono quando houver áreas
  useEffect(() => {
    if (routeAreas.length > 0 && !loadingData) {
      loadStreetsInPolygon();
    } else {
      setStreetsInPolygon([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAreas, loadingData]);

  // Calcular porcentagem quando os dados mudarem
  useEffect(() => {
    if (selectedExecution && routeData && !loadingData && !loadingStreets) {
      calculateCompletionPercentage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsTrack, routeData, collectionPoints, selectedExecution, loadingData, loadingStreets, streetsInPolygon]);

  const loadExecutions = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.EXECUTIONS.LIST);
      if (response.success && response.data) {
        const executionsData = response.data.executions || response.data.data?.executions || [];
        setExecutions(Array.isArray(executionsData) ? executionsData : []);
      }
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionData = async () => {
    if (!selectedExecution) return;

    setLoadingData(true);
    try {
      const executionId = selectedExecution.id;
      const routeId = selectedExecution.assignment?.route?.id || 
                     selectedExecution.routeId || 
                     selectedExecution.route?.id;

      // Carregar rastro GPS
      const gpsResponse = await apiService.get(API_ENDPOINTS.EXECUTIONS.GPS(executionId));
      if (gpsResponse.success && gpsResponse.data) {
        const track = gpsResponse.data.gps_track || [];
        setGpsTrack(track);
      }

      // Carregar dados da rota
      if (routeId) {
        const routeResponse = await apiService.get(API_ENDPOINTS.ROUTES.GET(routeId));
        if (routeResponse.success && routeResponse.data) {
          const route = routeResponse.data.route || routeResponse.data;
          setRouteData(route);
          
          // Carregar pontos de coleta
          const points = route.collection_points || route.collectionPoints || [];
          setCollectionPoints(points.sort((a: CollectionPoint, b: CollectionPoint) => 
            (a.sequence_order || 0) - (b.sequence_order || 0)
          ));

          // Carregar áreas/polígonos da rota
          try {
            const mapResponse = await apiService.get(API_ENDPOINTS.ROUTES.MAP.GET_ROUTE_MAP(routeId));
            if (mapResponse.success && mapResponse.data) {
              const geojson = mapResponse.data.geojson || mapResponse.data.data?.geojson;
              if (geojson && geojson.features && Array.isArray(geojson.features)) {
                // Garantir que cada feature tenha o formato GeoJSON válido
                const validFeatures = geojson.features
                  .map((f: any) => {
                    if (!f || !f.geometry) return null;
                    return {
                      type: f.type || 'Feature',
                      geometry: f.geometry,
                      properties: f.properties || {}
                    };
                  })
                  .filter((f: any) => 
                    f && 
                    f.geometry && 
                    f.geometry.type && 
                    f.geometry.coordinates &&
                    Array.isArray(f.geometry.coordinates)
                  );
                setRouteAreas(validFeatures);
              } else {
                setRouteAreas([]);
              }
            } else {
              setRouteAreas([]);
            }
          } catch (error) {
            console.error('Erro ao carregar áreas da rota:', error);
            setRouteAreas([]);
          }
        }
      }

      // Calcular porcentagem de conclusão será feito em um useEffect separado
    } catch (error) {
      console.error('Erro ao carregar dados da execução:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Função para verificar se um ponto está dentro de um polígono (Ray casting algorithm)
  const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Função para calcular distância entre dois pontos (Haversine)
  const distanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Retorna em metros
  };

  // Função para verificar se uma rua foi percorrida (pontos GPS próximos aos segmentos da rua)
  const streetWasTraversed = (street: any, gpsPoints: GPSRecord[], thresholdMeters: number = 30): boolean => {
    // Overpass API retorna geometry como array de objetos {lat, lon}
    let streetCoords: number[][] = [];
    
    if (Array.isArray(street.geometry)) {
      // Formato Overpass: geometry é array de {lat, lon}
      streetCoords = street.geometry.map((point: any) => {
        if (point.lat !== undefined && point.lon !== undefined) {
          return [point.lon, point.lat]; // Converter para [lon, lat]
        }
        return null;
      }).filter((coord: any) => coord !== null);
    } else if (street.geometry && street.geometry.coordinates) {
      // Formato GeoJSON: coordinates é array de [lon, lat]
      streetCoords = street.geometry.coordinates;
    }
    
    if (!Array.isArray(streetCoords) || streetCoords.length < 2) return false;
    
    // Para cada segmento da rua, verificar se há pontos GPS próximos
    for (let i = 0; i < streetCoords.length - 1; i++) {
      const coord1 = streetCoords[i];
      const coord2 = streetCoords[i + 1];
      
      if (!Array.isArray(coord1) || !Array.isArray(coord2)) continue;
      if (coord1.length < 2 || coord2.length < 2) continue;
      
      const [lon1, lat1] = coord1;
      const [lon2, lat2] = coord2;
      
      // Verificar se algum ponto GPS está próximo deste segmento
      for (const gpsPoint of gpsPoints) {
        if (!gpsPoint.latitude || !gpsPoint.longitude) continue;
        
        const dist = distanceToSegment(
          gpsPoint.latitude,
          gpsPoint.longitude,
          lat1,
          lon1,
          lat2,
          lon2
        );
        
        if (dist <= thresholdMeters) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Função para calcular distância de um ponto a um segmento de linha (em metros)
  const distanceToSegment = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    // Converter coordenadas para radianos
    const lat1 = x1 * Math.PI / 180;
    const lon1 = y1 * Math.PI / 180;
    const lat2 = x2 * Math.PI / 180;
    const lon2 = y2 * Math.PI / 180;
    const latP = px * Math.PI / 180;
    const lonP = py * Math.PI / 180;
    
    // Calcular distância do ponto ao segmento usando fórmula de distância de ponto a linha em esfera
    // Encontrar o ponto mais próximo no segmento
    const A = latP - lat1;
    const B = lonP - lon1;
    const C = lat2 - lat1;
    const D = lon2 - lon1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = 0;
    
    if (lenSq !== 0) {
      param = Math.max(0, Math.min(1, dot / lenSq));
    }
    
    const closestLat = lat1 + param * C;
    const closestLon = lon1 + param * D;
    
    // Calcular distância usando Haversine
    return distanceBetweenPoints(
      px, py,
      closestLat * 180 / Math.PI,
      closestLon * 180 / Math.PI
    );
  };

  // Carregar ruas dentro do polígono usando Overpass API
  const loadStreetsInPolygon = async () => {
    if (routeAreas.length === 0) {
      setStreetsInPolygon([]);
      return;
    }

    setLoadingStreets(true);
    try {
      // Usar o primeiro polígono (ou combinar todos se houver múltiplos)
      const polygon = routeAreas[0];
      if (!polygon.geometry || polygon.geometry.type !== 'Polygon') {
        setStreetsInPolygon([]);
        setLoadingStreets(false);
        return;
      }

      const coordinates = polygon.geometry.coordinates[0];
      if (!coordinates || coordinates.length < 3) {
        setStreetsInPolygon([]);
        setLoadingStreets(false);
        return;
      }

      // Construir query Overpass para buscar ruas dentro do polígono
      // Overpass usa formato: (lat1,lon1,lat2,lon2,...)
      const polygonString = coordinates
        .map((coord: number[]) => `${coord[1]} ${coord[0]}`) // Converter [lng, lat] para "lat lon" (sem vírgula)
        .join(' ');

      const overpassQuery = `[out:json][timeout:25];
(
  way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|living_street)$"](poly:"${polygonString}");
);
out geom;`;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (response.ok) {
        const data = await response.json();
        const streets = (data.elements || []).filter((element: any) => 
          element.type === 'way' && 
          element.geometry && 
          Array.isArray(element.geometry) &&
          element.geometry.length >= 2
        );
        console.log(`Carregadas ${streets.length} ruas dentro do polígono`);
        setStreetsInPolygon(streets);
      } else {
        const errorText = await response.text();
        console.error('Erro ao buscar ruas:', response.status, errorText);
        setStreetsInPolygon([]);
      }
    } catch (error) {
      console.error('Erro ao carregar ruas do polígono:', error);
      setStreetsInPolygon([]);
    } finally {
      setLoadingStreets(false);
    }
  };

  const calculateCompletionPercentage = () => {
    if (!selectedExecution || !routeData) {
      setCompletionPercentage(0);
      return;
    }

    const collectionType = routeData.collection_type || routeData.collectionType || '';
    const isContainer = collectionType === 'CONTAINER';

    if (isContainer) {
      // Para CONTAINER: pontos coletados / pontos esperados
      const expectedPoints = collectionPoints.length;
      const collectedPoints = selectedExecution.points_collected || 0;
      
      if (expectedPoints > 0) {
        const percentage = (collectedPoints / expectedPoints) * 100;
        setCompletionPercentage(Math.min(100, Math.max(0, percentage)));
      } else {
        setCompletionPercentage(0);
      }
    } else {
      // Para não-CONTAINER: comparar ruas percorridas vs ruas esperadas dentro do polígono
      if (streetsInPolygon.length === 0) {
        // Se não há ruas carregadas ainda, usar fallback
        setCompletionPercentage(0);
        return;
      }

      // Filtrar pontos GPS válidos
      const validGpsPoints = gpsTrack.filter(
        record => record.latitude && record.longitude
      );

      if (validGpsPoints.length === 0) {
        setCompletionPercentage(0);
        calculateMapBounds();
        return;
      }

      // Calcular porcentagem usando ruas percorridas
      const totalStreets = streetsInPolygon.length;
      if (totalStreets > 0) {
        const percentage = (traversedStreetsCount / totalStreets) * 100;
        setCompletionPercentage(Math.min(100, Math.max(0, percentage)));
      } else {
        setCompletionPercentage(0);
      }
    }

    // Calcular bounds do mapa
    calculateMapBounds();
  };

  const calculateMapBounds = () => {
    const bounds = new L.LatLngBounds([]);
    let hasBounds = false;

    // Adicionar pontos GPS
    if (gpsTrack.length > 0) {
      gpsTrack.forEach(record => {
        if (record.latitude && record.longitude) {
          bounds.extend([record.latitude, record.longitude]);
          hasBounds = true;
        }
      });
    }

    // Adicionar pontos de coleta
    if (collectionPoints.length > 0) {
      collectionPoints.forEach(point => {
        if (point.latitude && point.longitude) {
          bounds.extend([point.latitude, point.longitude]);
          hasBounds = true;
        }
      });
    }

    // Adicionar polígonos
    if (routeAreas.length > 0) {
      routeAreas.forEach(area => {
        if (area.geometry && area.geometry.type === 'Polygon' && area.geometry.coordinates && area.geometry.coordinates[0]) {
          area.geometry.coordinates[0].forEach((coord: number[]) => {
            if (coord && Array.isArray(coord) && coord.length >= 2) {
              bounds.extend([coord[1], coord[0]]); // GeoJSON usa [lng, lat]
              hasBounds = true;
            }
          });
        }
      });
    }

    if (hasBounds) {
      setMapBounds(bounds);
    } else {
      // Default bounds (Francisco Beltrão/PR)
      setMapBounds(L.latLngBounds(
        [-26.25, -52.7],
        [-26.2, -52.65]
      ));
    }
  };

  // Preparar coordenadas com tratamento de erro usando useMemo
  const actualRouteCoords = useMemo((): [number, number][] => {
    try {
      return gpsTrack
        .filter(record => record && record.latitude && record.longitude)
        .map(record => [record.latitude, record.longitude]);
    } catch (error) {
      console.error('Erro ao preparar coordenadas da rota realizada:', error);
      return [];
    }
  }, [gpsTrack]);

  // Calcular ruas percorridas
  const traversedStreetsCount = useMemo(() => {
    if (streetsInPolygon.length === 0) return 0;
    const validGpsPoints = gpsTrack.filter(
      record => record.latitude && record.longitude
    );
    if (validGpsPoints.length === 0) return 0;
    return streetsInPolygon.filter(street => 
      streetWasTraversed(street, validGpsPoints)
    ).length;
  }, [gpsTrack, streetsInPolygon]);

  const expectedRouteCoords = useMemo((): [number, number][] => {
    try {
      const collectionType = routeData?.collection_type || routeData?.collectionType || '';
      const isContainer = collectionType === 'CONTAINER';

      if (isContainer) {
        // Para CONTAINER: conectar os pontos de coleta
        return collectionPoints
          .filter(point => point && point.latitude && point.longitude)
          .map(point => [point.latitude, point.longitude]);
      } else {
        // Para não-CONTAINER: usar uma aproximação do perímetro do polígono
        // Se houver polígonos, usar o primeiro polígono como referência
        if (routeAreas.length > 0 && 
            routeAreas[0] && 
            routeAreas[0].geometry && 
            routeAreas[0].geometry.type === 'Polygon' &&
            routeAreas[0].geometry.coordinates &&
            Array.isArray(routeAreas[0].geometry.coordinates[0])) {
          const coords = routeAreas[0].geometry.coordinates[0];
          return coords
            .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
            .map((coord: number[]) => [coord[1], coord[0]]); // Converter [lng, lat] para [lat, lng]
        }
        return [];
      }
    } catch (error) {
      console.error('Erro ao preparar coordenadas da rota esperada:', error);
      return [];
    }
  }, [routeData, collectionPoints, routeAreas]);

  return (
    <Layout>
      <div className="execution-reports-page">
        <div className="page-header">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/executions')}
            style={{ marginRight: '15px' }}
          >
            <FaArrowLeft /> Voltar para Execuções
          </button>
          <h2>
            <FaChartLine /> Relatórios de Execução
          </h2>
        </div>

        {/* Seleção de Execução */}
        {!executionIdParam && (
          <div className="execution-selector">
            <label htmlFor="execution-select">
              <FaRoute /> Selecione uma Execução:
            </label>
            <select
              id="execution-select"
              className="form-select"
              value={selectedExecution?.id || ''}
              onChange={(e) => {
                const execId = Number(e.target.value);
                const exec = executions.find(ex => ex.id === execId);
                if (exec) {
                  navigate(`/execution-reports?executionId=${execId}`);
                }
              }}
              disabled={loading}
            >
              <option value="">-- Selecione uma execução --</option>
              {executions.map(exec => (
                <option key={exec.id} value={exec.id}>
                  #{exec.id} - {exec.assignment?.route?.name || exec.route?.name || 'Rota sem nome'} - {exec.execution_date || 'Sem data'}
                </option>
              ))}
            </select>
          </div>
        )}

        {executionIdParam && !selectedExecution && !loading && (
          <div className="alert alert-warning">
            <FaInfoCircle /> Execução #{executionIdParam} não encontrada.
          </div>
        )}

        {(loadingData || loadingStreets) && (
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando dados...</span>
            </div>
            <p>
              {loadingData ? 'Carregando dados da execução...' : 'Carregando ruas do polígono...'}
            </p>
          </div>
        )}

        {selectedExecution && !loadingData && !loadingStreets && (
          <>
            {/* Informações da Execução */}
            <div className="execution-info-card">
              <div className="info-row">
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div>
                    <div className="info-label">Motorista</div>
                    <div className="info-value">
                      {selectedExecution.assignment?.driver?.name || 
                       selectedExecution.driver?.name || 
                       selectedExecution.driverName || 
                       'N/A'}
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <FaRoad className="info-icon" />
                  <div>
                    <div className="info-label">Rota</div>
                    <div className="info-value">
                      {selectedExecution.assignment?.route?.name || 
                       selectedExecution.route?.name || 
                       routeData?.name || 
                       'N/A'}
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <FaInfoCircle className="info-icon" />
                  <div>
                    <div className="info-label">Status</div>
                    <div className="info-value">
                      <span className={`badge ${
                        selectedExecution.status === 'COMPLETED' ? 'bg-success' : 
                        selectedExecution.status === 'IN_PROGRESS' ? 'bg-warning' : 
                        'bg-secondary'
                      }`}>
                        {selectedExecution.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relatório de Porcentagem */}
            <div className="completion-report">
              <h3>
                <FaChartLine /> Porcentagem de Conclusão da Rota
              </h3>
              <div className="completion-card">
                <div 
                  className="completion-circle"
                  style={{ '--percentage': completionPercentage } as React.CSSProperties}
                >
                  <div className="completion-value">{completionPercentage.toFixed(1)}%</div>
                  <div className="completion-label">Concluído</div>
                </div>
                <div className="completion-details">
                  <div className="detail-item">
                    <FaInfoCircle /> <strong>Tipo de Coleta:</strong>{' '}
                    {routeData?.collection_type || routeData?.collectionType || 'N/A'}
                  </div>
                  {routeData?.collection_type === 'CONTAINER' || routeData?.collectionType === 'CONTAINER' ? (
                    <>
                      <div className="detail-item">
                        <FaCheckCircle /> <strong>Pontos Coletados:</strong>{' '}
                        {selectedExecution.points_collected || 0} / {collectionPoints.length}
                      </div>
                      <div className="detail-item">
                        <FaRoute /> <strong>Pontos Esperados:</strong> {collectionPoints.length}
                      </div>
                    </>
                  ) : (
                    <>
                  <div className="detail-item">
                    <FaRoute /> <strong>Pontos GPS Registrados:</strong> {gpsTrack.length}
                  </div>
                  {loadingStreets ? (
                    <div className="detail-item">
                      <FaInfoCircle /> <strong>Carregando ruas do polígono...</strong>
                    </div>
                  ) : streetsInPolygon.length > 0 ? (
                    <>
                      <div className="detail-item">
                        <FaRoute /> <strong>Ruas no Polígono:</strong> {streetsInPolygon.length}
                      </div>
                      <div className="detail-item">
                        <FaCheckCircle /> <strong>Ruas Percorridas:</strong> {traversedStreetsCount}
                      </div>
                    </>
                  ) : null}
                  <div className="detail-item">
                    <FaInfoCircle /> <strong>Status:</strong> {selectedExecution.status}
                  </div>
                    </>
                  )}
                  <div className="detail-item">
                    <FaRoute /> <strong>Distância Total:</strong>{' '}
                    {selectedExecution.totalDistance ? `${selectedExecution.totalDistance.toFixed(2)} km` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa Comparativo */}
            <div className="map-report">
              <h3>
                <FaMap /> Mapa: Rota Realizada vs Esperada
              </h3>
              <div className="map-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#28a745' }}></span>
                  <span>Rota Realizada (Verde)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#dc3545' }}></span>
                  <span>Rota Esperada (Vermelho)</span>
                </div>
                {(routeData?.collection_type === 'CONTAINER' || routeData?.collectionType === 'CONTAINER') && (
                  <div className="legend-item">
                    <span className="legend-marker">📍</span>
                    <span>Pontos de Coleta</span>
                  </div>
                )}
              </div>
              <div className="map-container">
                {(() => {
                  try {
                    return (
                      <MapContainer
                        center={[-26.23, -52.67]}
                        zoom={13}
                        style={{ height: '600px', width: '100%' }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {/* Rota Esperada (Vermelho) - desenhar primeiro para ficar atrás */}
                        {expectedRouteCoords.length > 0 && (
                          <Polyline
                            positions={expectedRouteCoords}
                            pathOptions={{
                              color: '#dc3545',
                              weight: 4,
                              opacity: 0.7,
                            }}
                          />
                        )}

                        {/* Polígonos da rota (se houver) */}
                        {routeAreas.length > 0 && routeAreas.map((area, index) => {
                          try {
                            // Criar um objeto GeoJSON Feature válido
                            const geoJsonFeature = {
                              type: area.type || 'Feature',
                              geometry: area.geometry || {},
                              properties: area.properties || {}
                            };
                            
                            // Validar se a geometria é válida
                            if (!geoJsonFeature.geometry || 
                                !geoJsonFeature.geometry.type || 
                                !geoJsonFeature.geometry.coordinates ||
                                !Array.isArray(geoJsonFeature.geometry.coordinates)) {
                              console.warn(`Área ${index} tem geometria inválida:`, geoJsonFeature);
                              return null;
                            }
                            
                            return (
                              <GeoJSON
                                key={`area-${index}`}
                                data={geoJsonFeature as any}
                                style={{
                                  color: '#dc3545',
                                  weight: 2,
                                  opacity: 0.5,
                                  fillColor: '#dc3545',
                                  fillOpacity: 0.1,
                                }}
                              />
                            );
                          } catch (error) {
                            console.error(`Erro ao renderizar área ${index}:`, error);
                            return null;
                          }
                        })}

                        {/* Rota Realizada (Verde) - desenhar por último para ficar por cima */}
                        {actualRouteCoords.length > 0 && (
                          <Polyline
                            positions={actualRouteCoords}
                            pathOptions={{
                              color: '#28a745',
                              weight: 5,
                              opacity: 0.8,
                            }}
                          />
                        )}

                        {/* Marcadores dos pontos de coleta (para CONTAINER) */}
                        {(routeData?.collection_type === 'CONTAINER' || routeData?.collectionType === 'CONTAINER') &&
                          collectionPoints
                            .filter(point => point && point.latitude && point.longitude)
                            .map(point => (
                              <Marker
                                key={point.id}
                                position={[point.latitude, point.longitude]}
                              >
                                <Popup>
                                  <div>
                                    <strong>Ponto #{point.sequence_order}</strong><br />
                                    {point.address}
                                  </div>
                                </Popup>
                              </Marker>
                            ))}

                        {/* Ajustar zoom */}
                        {mapBounds && <MapBounds bounds={mapBounds} />}
                      </MapContainer>
                    );
                  } catch (error) {
                    console.error('Erro ao renderizar mapa:', error);
                    return (
                      <div className="map-error">
                        <FaInfoCircle /> Erro ao carregar o mapa. Por favor, tente novamente.
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </>
        )}

        {!selectedExecution && !loading && (
          <div className="no-selection">
            <FaInfoCircle /> Selecione uma execução para ver os relatórios
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExecutionReports;

