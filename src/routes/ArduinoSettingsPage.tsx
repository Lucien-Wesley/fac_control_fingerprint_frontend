import React, { useState, useEffect } from 'react';
import { SerialPort, ArduinoStatus, arduinoService } from '../services/arduinoService';
import { Settings, Wifi, WifiOff, RefreshCw, Zap, CheckCircle, XCircle } from 'lucide-react';

const ArduinoSettingsPage: React.FC = () => {
  const [ports, setPorts] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [status, setStatus] = useState<ArduinoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadPorts(),
      loadStatus()
    ]);
  };

  const loadPorts = async () => {
    try {
      const availablePorts = await arduinoService.getAvailablePorts();
      setPorts(availablePorts);
    } catch (err) {
      console.error('Failed to load ports:', err);
      setError('Erreur lors du chargement des ports');
    }
  };

  const loadStatus = async () => {
    try {
      const currentStatus = await arduinoService.getConnectionStatus();
      setStatus(currentStatus);
      if (currentStatus.port && !selectedPort) {
        setSelectedPort(currentStatus.port);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  const handleRefreshPorts = async () => {
    setLoading(true);
    setError('');
    try {
      const refreshedPorts = await arduinoService.refreshPorts();
      setPorts(refreshedPorts);
      setSuccess('Liste des ports actualisée');
    } catch (err) {
      setError('Erreur lors de l\'actualisation des ports');
      console.error('Failed to refresh ports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      setError('Veuillez sélectionner un port');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await arduinoService.connectToPort(selectedPort);
      if (response.success) {
        setSuccess('Connexion établie avec succès');
        await loadStatus();
      } else {
        setError(response.message || 'Échec de la connexion');
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
      console.error('Connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await arduinoService.disconnect();
      if (response.success) {
        setSuccess('Déconnexion réussie');
        await loadStatus();
      } else {
        setError(response.message || 'Échec de la déconnexion');
      }
    } catch (err) {
      setError('Erreur lors de la déconnexion');
      console.error('Disconnection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await arduinoService.testConnection();
      if (response.success) {
        setSuccess(`Test réussi: ${response.response}`);
      } else {
        setError('Test de connexion échoué');
      }
    } catch (err) {
      setError('Erreur lors du test de connexion');
      console.error('Connection test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="h-7 w-7 mr-2 text-blue-600" />
          Paramètres Arduino
        </h1>
        <p className="text-gray-600 mt-1">
          Configuration de la connexion avec le module biométrique Arduino
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            {status?.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            État de connexion
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Statut</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status?.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status?.connected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Connecté
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Déconnecté
                  </>
                )}
              </span>
            </div>

            {status?.port && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Port</span>
                <span className="text-sm text-gray-900">{status.port}</span>
              </div>
            )}

            {status?.firmware && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Firmware</span>
                <span className="text-sm text-gray-900">{status.firmware}</span>
              </div>
            )}

            {status?.lastSeen && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Dernière connexion</span>
                <span className="text-sm text-gray-900">
                  {new Date(status.lastSeen).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {status?.connected && (
            <div className="mt-4">
              <button
                onClick={handleTestConnection}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                <Zap className="h-4 w-4 mr-2" />
                Tester la connexion
              </button>
            </div>
          )}
        </div>

        {/* Connection Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuration de connexion
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-2">
                Port série
              </label>
              <div className="flex space-x-2">
                <select
                  id="port"
                  value={selectedPort}
                  onChange={(e) => {
                    setSelectedPort(e.target.value);
                    clearMessages();
                  }}
                  className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Sélectionnez un port</option>
                  {ports.map((port) => (
                    <option key={port.port} value={port.port}>
                      {port.port} - {port.description}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRefreshPorts}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  title="Actualiser la liste des ports"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConnect}
                disabled={loading || !selectedPort || status?.connected}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Connecter
              </button>
              
              <button
                onClick={handleDisconnect}
                disabled={loading || !status?.connected}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Available Ports List */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ports disponibles ({ports.length})
        </h2>
        
        {ports.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun port série détecté</p>
        ) : (
          <div className="space-y-2">
            {ports.map((port) => (
              <div key={port.port} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div>
                  <div className="font-medium text-sm text-gray-900">{port.port}</div>
                  <div className="text-xs text-gray-500">
                    {port.description}
                    {port.manufacturer && ` - ${port.manufacturer}`}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{port.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArduinoSettingsPage;