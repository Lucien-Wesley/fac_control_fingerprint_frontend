import React, { useEffect, useState, useCallback } from 'react';
import Table from '../components/Table';
import { accessLogService, AccessLogEntry, AccessRange } from '../services/accessLogService';
import useEventSource from '../hooks/useEventSource';

const ranges: AccessRange[] = ['day', 'week', 'month', 'all'];

const AccessLogsPage: React.FC = () => {
  const [range, setRange] = useState<AccessRange>('day');
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r: AccessRange) => {
    setLoading(true);
    try {
      const data = await accessLogService.getLogs(r);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load access logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  // Handle real-time updates
  useEventSource('/arduino/access-logs', (data) => {
    // Expect data to be { type: 'access', payload: AccessLogEntry }
    if (!data) return;
    const payload = data.payload ?? data;
    // Prepend newest entry
    setLogs((prev) => {
      const exists = prev.find((l) => l.id === payload.id);
      if (exists) return prev;
      return [payload as AccessLogEntry, ...prev].slice(0, 500); // cap
    });
  });

  const columns = [
    { key: 'timestamp', label: 'Horodatage', render: (v: string) => new Date(v).toLocaleString() },
    { key: 'userName', label: "Nom d'utilisateur" },
    { key: 'role', label: 'Rôle' },
    { key: 'method', label: 'Méthode' },
    { key: 'result', label: 'Résultat' },
    { key: 'details', label: 'Détails', render: (v: any) => (v ? JSON.stringify(v) : '') },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journaux d'accès</h1>
          <p className="text-gray-600">Affiche les accès du jour, de la semaine, du mois ou tous les accès. Mise à jour en temps réel.</p>
        </div>
        <div className="space-x-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg border ${r === range ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {r === 'day' ? 'Jour' : r === 'week' ? 'Semaine' : r === 'month' ? 'Mois' : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns as any}
        data={logs}
        loading={loading}
        emptyMessage="Aucun accès trouvé"
      />
    </div>
  );
};

export default AccessLogsPage;
