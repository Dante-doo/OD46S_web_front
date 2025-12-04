import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './MapImport.css';

interface ImportSummary {
  total_features: number;
  routes_created: number;
  routes_linked: number;
  areas_created: number;
  areas_updated: number;
}

const MapImport: React.FC = () => {
  const [geojsonText, setGeojsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary?: ImportSummary; errors?: any[] } | null>(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!geojsonText.trim()) {
      setError('Por favor, cole ou insira um GeoJSON válido.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let geojsonData;
      try {
        geojsonData = JSON.parse(geojsonText);
      } catch (e) {
        setError('GeoJSON inválido. Verifique a formatação JSON.');
        setLoading(false);
        return;
      }

      // Validate it's a FeatureCollection
      if (geojsonData.type !== 'FeatureCollection' || !Array.isArray(geojsonData.features)) {
        setError('O GeoJSON deve ser um FeatureCollection com uma propriedade "features" (array).');
        setLoading(false);
        return;
      }

      const response = await apiService.post(API_ENDPOINTS.ROUTES.MAP.IMPORT_GEOJSON, geojsonData);

      if (response.success && response.data) {
        setResult(response.data);
        setGeojsonText(''); // Clear after successful import
      } else {
        setError(response.error?.message || 'Erro ao importar mapa.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar mapa.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setGeojsonText(content);
      setError('');
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };
    reader.readAsText(file);
  };

  return (
    <Layout>
      <div className="map-import-page">
        <div className="page-header">
          <h2>Importar Mapa de Rotas</h2>
          <p className="text-muted">Importe áreas de rotas a partir de um arquivo GeoJSON (FeatureCollection)</p>
        </div>

        <div className="import-container">
          <div className="import-section">
            <label htmlFor="geojson-input" className="form-label">
              GeoJSON FeatureCollection
            </label>
            <textarea
              id="geojson-input"
              className="form-control geojson-textarea"
              rows={15}
              value={geojsonText}
              onChange={(e) => {
                setGeojsonText(e.target.value);
                setError('');
              }}
              placeholder='Cole aqui o GeoJSON no formato: { "type": "FeatureCollection", "features": [...] }'
              disabled={loading}
            />
            <div className="mt-3">
              <label htmlFor="file-upload" className="btn btn-outline-secondary">
                Ou fazer upload de arquivo
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".json,.geojson"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}

          {result && result.summary && (
            <div className="alert alert-success mt-3" role="alert">
              <h5>Importação concluída com sucesso!</h5>
              <ul className="mb-0">
                <li>Total de features processadas: {result.summary.total_features}</li>
                <li>Rotas criadas: {result.summary.routes_created}</li>
                <li>Rotas vinculadas: {result.summary.routes_linked}</li>
                <li>Áreas criadas: {result.summary.areas_created}</li>
                <li>Áreas atualizadas: {result.summary.areas_updated}</li>
              </ul>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <strong>Erros encontrados ({result.errors.length}):</strong>
                  <ul>
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx}>
                        Feature {err.feature_index}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleImport}
              disabled={loading || !geojsonText.trim()}
            >
              {loading ? 'Importando...' : 'Importar Mapa'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapImport;

