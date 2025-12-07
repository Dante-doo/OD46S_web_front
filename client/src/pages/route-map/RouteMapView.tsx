import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import { FaMap, FaFilter, FaInfoCircle } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import 'leaflet/dist/leaflet.css';
import './RouteMapView.css';

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

interface RouteArea {
  id: number;
  routeId: number;
  route_id?: number; // Fallback para compatibilidade
  externalName: string;
  external_name?: string; // Fallback para compatibilidade
  wasteType: string;
  waste_type?: string; // Fallback para compatibilidade
  strokeColor: string;
  stroke_color?: string; // Fallback para compatibilidade
  fillColor: string;
  fill_color?: string; // Fallback para compatibilidade
  fillOpacity: number;
  fill_opacity?: number; // Fallback para compatibilidade
  active: boolean;
}

interface GeoJsonFeature {
  type: string;
  properties: RouteArea;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface GeoJsonFeatureCollection {
  type: string;
  features: GeoJsonFeature[];
}

// Componente para ajustar o zoom do mapa baseado nos dados
function MapBounds({ geojson }: { geojson: GeoJsonFeatureCollection | null }) {
  const map = useMap();

  useEffect(() => {
    if (geojson && geojson.features.length > 0) {
      try {
        console.log('MapBounds: Ajustando zoom para', geojson.features.length, 'features');
        const bounds = L.geoJSON(geojson as any).getBounds();
        if (bounds.isValid()) {
          console.log('MapBounds: Bounds válidos', bounds.toBBoxString());
          map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          console.warn('MapBounds: Bounds inválidos');
        }
      } catch (error) {
        console.error('Erro ao calcular bounds:', error);
      }
    }
  }, [geojson, map]);

  return null;
}

const RouteMapView: React.FC = () => {
  const [geojson, setGeojson] = useState<GeoJsonFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWasteType, setSelectedWasteType] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(null);

  useEffect(() => {
    loadRoutes();
    loadMapData();
  }, []);

  useEffect(() => {
    loadMapData();
  }, [selectedWasteType, selectedRouteId, showActiveOnly]);

  const loadRoutes = async () => {
    try {
      // Buscar todas as rotas (usar limite máximo de 100)
      const response = await apiService.get(`${API_ENDPOINTS.ROUTES.LIST}?search=&page=1&limit=100&sort=name&order=asc`);
      if (response.success && response.data) {
        const routesData = response.data.routes || response.data.data?.routes || [];
        setRoutes(Array.isArray(routesData) ? routesData : []);
        console.log('Rotas carregadas:', routesData.length);
      }
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    }
  };

  const loadMapData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedWasteType) params.append('wasteType', selectedWasteType);
      if (selectedRouteId) params.append('routeId', selectedRouteId.toString());
      // Sempre enviar o parâmetro active para evitar o default do backend
      params.append('active', showActiveOnly ? 'true' : 'false');

      const url = `${API_ENDPOINTS.ROUTES.MAP.GET_GEO}${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Carregando mapa com URL:', url);
      const response = await apiService.get(url);
      console.log('Resposta do mapa:', response);

      if (response.success && response.data) {
        const geojsonData = response.data.geojson || response.data.data?.geojson;
        if (geojsonData) {
          console.log('GeoJSON carregado:', geojsonData.features?.length || 0, 'features');
          // Verifica se as 5 áreas estão presentes
          const targetNames = ['Santa Terezinha', 'Morumbi', 'Vila Isabel', 'Pinheiros', 'Cadorin'];
          const foundNames = geojsonData.features
            ?.map((f: any) => f.properties?.externalName || f.properties?.external_name)
            .filter((n: string) => targetNames.includes(n)) || [];
          console.log('Áreas encontradas:', foundNames);
          if (foundNames.length < targetNames.length) {
            console.warn('Algumas áreas não foram encontradas:', 
              targetNames.filter(n => !foundNames.includes(n)));
          }
          setGeojson(geojsonData);
        } else {
          setError('Formato de dados inválido');
        }
      } else {
        setError(response.error?.message || 'Erro ao carregar dados do mapa');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = (feature: GeoJsonFeature) => {
    setSelectedFeature(feature);
  };

  const getFeatureStyle = (feature: GeoJsonFeature): L.PathOptions => {
    const props = feature.properties;
    return {
      fillColor: props.fillColor || props.fill_color || '#0066CC',
      fillOpacity: props.fillOpacity || props.fill_opacity || 0.4,
      color: props.strokeColor || props.stroke_color || '#0066CC',
      weight: 2,
      opacity: 0.8,
    };
  };

  const onEachFeature = (feature: GeoJsonFeature, layer: L.Layer) => {
    const props = feature.properties;
    const externalName = props.externalName || props.external_name || 'Área sem nome';
    const wasteType = props.wasteType || props.waste_type || 'N/A';
    const routeId = props.routeId || props.route_id || 'N/A';
    const popupContent = `
      <div style="padding: 8px;">
        <strong>${externalName}</strong><br/>
        <small>Tipo: ${wasteType}</small><br/>
        <small>Rota ID: ${routeId}</small><br/>
        <small>Status: ${props.active ? 'Ativa' : 'Inativa'}</small>
      </div>
    `;
    layer.bindPopup(popupContent);

    if (layer instanceof L.Path) {
      layer.on({
        click: () => handleFeatureClick(feature),
        mouseover: (e) => {
          const target = e.target as L.Path;
          target.setStyle({
            weight: 4,
            fillOpacity: 0.6,
          });
        },
        mouseout: (e) => {
          const target = e.target as L.Path;
          target.setStyle(getFeatureStyle(feature));
        },
      });
    }
  };

  const wasteTypes = ['RECYCLABLE', 'RESIDENTIAL', 'COMMERCIAL', 'HOSPITAL', 'SELECTIVE'];

  return (
    <Layout>
      <div className="route-map-page">
        <div className="page-header">
          <h2>
            <FaMap /> Mapa de Rotas
          </h2>
          <div className="header-actions">
            <button 
              className="btn btn-outline-primary"
              onClick={loadMapData}
              disabled={loading}
            >
              <FaFilter /> Atualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="map-filters">
          <div className="filter-group">
            <label>Tipo de Resíduo:</label>
            <select
              className="form-select"
              value={selectedWasteType}
              onChange={(e) => setSelectedWasteType(e.target.value)}
            >
              <option value="">Todos</option>
              {wasteTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Rota Específica:</label>
            <select
              className="form-select"
              value={selectedRouteId || ''}
              onChange={(e) => setSelectedRouteId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todas as rotas</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="form-check-label">
              <input
                type="checkbox"
                className="form-check-input"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              Apenas rotas ativas
            </label>
          </div>
        </div>

        {/* Mapa */}
        <div className="map-container">
          {loading ? (
            <div className="map-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando mapa...</span>
              </div>
              <p>Carregando áreas de rotas...</p>
            </div>
          ) : error ? (
            <div className="map-error">
              <FaInfoCircle /> {error}
            </div>
          ) : (
            <MapContainer
              center={[-26.23, -52.67]} // Coordenadas aproximadas de Francisco Beltrão/PR
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geojson && (
                <>
                  <GeoJSON
                    data={geojson as any}
                    style={getFeatureStyle}
                    onEachFeature={onEachFeature}
                    pointToLayer={(feature, latlng) => {
                      // Para pontos, cria um marcador customizado
                      if (feature.geometry.type === 'Point') {
                        const props = feature.properties;
                        const externalName = props.externalName || props.external_name || props.name || 'Ponto';
                        const wasteType = props.wasteType || props.waste_type || 'N/A';
                        const routeId = props.routeId || props.route_id;
                        const marker = L.marker(latlng, { icon: DefaultIcon });
                        const popupContent = `
                          <div style="padding: 8px;">
                            <strong>${externalName}</strong><br/>
                            <small>Tipo: ${wasteType}</small><br/>
                            ${routeId ? `<small>Rota ID: ${routeId}</small><br/>` : ''}
                            <small>Status: ${props.active ? 'Ativa' : 'Inativa'}</small>
                          </div>
                        `;
                        marker.bindPopup(popupContent);
                        marker.on('click', () => {
                          handleFeatureClick(feature);
                        });
                        return marker;
                      }
                      return null;
                    }}
                  />
                  <MapBounds geojson={geojson} />
                </>
              )}
            </MapContainer>
          )}
        </div>

        {/* Painel de informações */}
        {selectedFeature && (
          <div className="map-info-panel">
            <div className="info-panel-header">
              <h5>Informações da Área</h5>
              <button
                className="btn-close"
                onClick={() => setSelectedFeature(null)}
              >
                ×
              </button>
            </div>
            <div className="info-panel-body">
              <p><strong>Nome:</strong> {selectedFeature.properties.externalName || selectedFeature.properties.external_name || 'N/A'}</p>
              <p><strong>Tipo de Resíduo:</strong> {selectedFeature.properties.wasteType || selectedFeature.properties.waste_type || 'N/A'}</p>
              <p><strong>Rota ID:</strong> {selectedFeature.properties.routeId || selectedFeature.properties.route_id || 'N/A'}</p>
              <p><strong>Status:</strong> {selectedFeature.properties.active ? 'Ativa' : 'Inativa'}</p>
              <p><strong>Cor:</strong> 
                <span 
                  style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: selectedFeature.properties.fillColor || selectedFeature.properties.fill_color || '#0066CC',
                    marginLeft: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '3px'
                  }}
                />
              </p>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        {geojson && (
          <div className="map-stats">
            <div className="stat-item">
              <strong>{geojson.features.length}</strong> áreas carregadas
            </div>
            <div className="stat-item">
              <strong>
                {geojson.features.filter(f => f.properties.active).length}
              </strong> áreas ativas
            </div>
            <div className="stat-item">
              <strong>
                {new Set(geojson.features.map(f => f.properties.wasteType || f.properties.waste_type)).size}
              </strong> tipos de resíduo
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RouteMapView;

