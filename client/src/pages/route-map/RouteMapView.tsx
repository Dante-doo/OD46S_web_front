import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import { FaMap, FaFilter, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [geojson, setGeojson] = useState<GeoJsonFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(null);

  useEffect(() => {
    loadRoutes();
    loadMapData();
  }, []);

  useEffect(() => {
    loadMapData();
  }, [selectedWasteTypes, selectedRouteIds, showActiveOnly]);

  const loadRoutes = async () => {
    try {
      // Buscar todas as rotas
      const response = await apiService.get(`${API_ENDPOINTS.ROUTES.LIST}?search=`);
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
      // Sempre buscar todos os dados e filtrar no frontend para garantir consistência
      const params = new URLSearchParams();
      params.append('active', showActiveOnly ? 'true' : 'false');
      const url = `${API_ENDPOINTS.ROUTES.MAP.GET_GEO}?${params.toString()}`;
      
      console.log('Carregando dados do mapa:', url);
      console.log('Filtros selecionados - Tipos:', selectedWasteTypes, 'Rotas:', selectedRouteIds);
      
      const response = await apiService.get(url);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Erro ao carregar dados do mapa');
      }

      const geojsonData = response.data.geojson || response.data.data?.geojson;
      
      if (!geojsonData || !geojsonData.features) {
        setError('Formato de dados inválido');
        return;
      }

      console.log('Total de features recebidas:', geojsonData.features.length);
      
      // Log de exemplo das propriedades para debug
      if (geojsonData.features.length > 0) {
        console.log('Exemplo de propriedades da primeira feature:', geojsonData.features[0].properties);
        console.log('Chaves disponíveis nas propriedades:', Object.keys(geojsonData.features[0].properties));
      }

      // Filtrar no frontend
      let filteredFeatures = [...geojsonData.features];

      // Aplicar filtros apenas se houver seleções
      const hasWasteTypeFilter = selectedWasteTypes.length > 0;
      const hasRouteFilter = selectedRouteIds.length > 0;

      // Filtrar por tipos de resíduo
      if (hasWasteTypeFilter) {
        const beforeFilter = filteredFeatures.length;
        filteredFeatures = filteredFeatures.filter((feature: GeoJsonFeature) => {
          const props = feature.properties;
          const wasteType = props.wasteType || props.waste_type || '';
          const matches = selectedWasteTypes.includes(wasteType);
          return matches;
        });
        console.log(`Filtro por tipos de resíduo: ${beforeFilter} -> ${filteredFeatures.length} features`);
      }

      // Filtrar por rotas
      if (hasRouteFilter) {
        const beforeFilter = filteredFeatures.length;
        filteredFeatures = filteredFeatures.filter((feature: GeoJsonFeature) => {
          const props = feature.properties;
          const routeId = props.routeId || props.route_id;
          if (!routeId) return false;
          const routeIdNum = typeof routeId === 'number' ? routeId : Number(routeId);
          return selectedRouteIds.includes(routeIdNum);
        });
        console.log(`Filtro por rotas: ${beforeFilter} -> ${filteredFeatures.length} features`);
      }

      // Se não há filtros selecionados, mostrar todas as features (já está correto)
      if (!hasWasteTypeFilter && !hasRouteFilter) {
        console.log('Nenhum filtro selecionado, mostrando todas as features');
      }

      // Criar novo GeoJSON com features filtradas
      const filteredGeoJson: GeoJsonFeatureCollection = {
        ...geojsonData,
        features: filteredFeatures
      };

      console.log('GeoJSON final filtrado:', filteredFeatures.length, 'features');
      console.log('Primeira feature (exemplo):', filteredFeatures[0]?.properties);
      
      setGeojson(filteredGeoJson);
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
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

  const handleWasteTypeToggle = (wasteType: string) => {
    setSelectedWasteTypes(prev => 
      prev.includes(wasteType) 
        ? prev.filter(t => t !== wasteType)
        : [...prev, wasteType]
    );
  };

  const handleRouteToggle = (routeId: number) => {
    setSelectedRouteIds(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const handleSelectAllWasteTypes = () => {
    if (selectedWasteTypes.length === wasteTypes.length) {
      setSelectedWasteTypes([]);
    } else {
      setSelectedWasteTypes([...wasteTypes]);
    }
  };

  const handleSelectAllRoutes = () => {
    if (selectedRouteIds.length === routes.length) {
      setSelectedRouteIds([]);
    } else {
      setSelectedRouteIds(routes.map(r => r.id));
    }
  };

  return (
    <Layout>
      <div className="route-map-page">
        <div className="page-header">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/routes')}
            style={{ marginRight: '15px' }}
          >
            <FaArrowLeft /> Voltar para Rotas
          </button>
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
          <div className="filter-group filter-group-checkboxes">
            <label>Tipo de Resíduo:</label>
            <div className="checkbox-group">
              <label className="checkbox-select-all">
                <input
                  type="checkbox"
                  checked={selectedWasteTypes.length === wasteTypes.length && wasteTypes.length > 0}
                  onChange={handleSelectAllWasteTypes}
                />
                <span>Selecionar Todos</span>
              </label>
              {wasteTypes.map((type) => (
                <label key={type} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedWasteTypes.includes(type)}
                    onChange={() => handleWasteTypeToggle(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group filter-group-checkboxes">
            <label>Rota Específica:</label>
            <div className="checkbox-group">
              <label className="checkbox-select-all">
                <input
                  type="checkbox"
                  checked={selectedRouteIds.length === routes.length && routes.length > 0}
                  onChange={handleSelectAllRoutes}
                />
                <span>Selecionar Todas</span>
              </label>
              {routes.map((route) => (
                <label key={route.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedRouteIds.includes(route.id)}
                    onChange={() => handleRouteToggle(route.id)}
                  />
                  <span>{route.name}</span>
                </label>
              ))}
            </div>
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
      </div>
    </Layout>
  );
};

export default RouteMapView;

