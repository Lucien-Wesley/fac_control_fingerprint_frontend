import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Settings, Activity, Fingerprint, TrendingUp } from 'lucide-react';
import { studentService, Student } from '../services/studentService';
import { professorService, Professor } from '../services/professorService';
import { arduinoService, ArduinoStatus } from '../services/arduinoService';

interface DashboardStats {
  totalStudents: number;
  totalProfessors: number;
  studentsWithFingerprint: number;
  professorsWithFingerprint: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalProfessors: 0,
    studentsWithFingerprint: 0,
    professorsWithFingerprint: 0,
  });
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentProfessors, setRecentProfessors] = useState<Professor[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [students, professors, status] = await Promise.all([
        studentService.getAllStudents(),
        professorService.getAllProfessors(),
        arduinoService.getConnectionStatus().catch(() => null),
      ]);

      // Calculate stats
      const studentsWithFingerprint = students.filter(s => s.fingerprintId).length;
      const professorsWithFingerprint = professors.filter(p => p.fingerprintId).length;

      setStats({
        totalStudents: students.length,
        totalProfessors: professors.length,
        studentsWithFingerprint,
        professorsWithFingerprint,
      });

      setArduinoStatus(status);
      
      // Get recent entries (last 5)
      setRecentStudents(students.slice(-5).reverse());
      setRecentProfessors(professors.slice(-5).reverse());

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-medium text-gray-900">{value}</div>
              {subtitle && (
                <div className="text-sm text-gray-500">{subtitle}</div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Activity className="h-7 w-7 mr-2 text-blue-600" />
          Tableau de bord
        </h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de votre système de gestion biométrique
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Étudiants"
          value={stats.totalStudents}
          subtitle={`${stats.studentsWithFingerprint} avec empreinte`}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        
        <StatCard
          title="Total Professeurs"
          value={stats.totalProfessors}
          subtitle={`${stats.professorsWithFingerprint} avec empreinte`}
          icon={<UserCheck className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        
        <StatCard
          title="Empreintes Enregistrées"
          value={stats.studentsWithFingerprint + stats.professorsWithFingerprint}
          subtitle={`Sur ${stats.totalStudents + stats.totalProfessors} personnes`}
          icon={<Fingerprint className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
        
        <StatCard
          title="Taux d'Enregistrement"
          value={
            stats.totalStudents + stats.totalProfessors > 0
              ? Math.round(((stats.studentsWithFingerprint + stats.professorsWithFingerprint) / 
                          (stats.totalStudents + stats.totalProfessors)) * 100)
              : 0
          }
          subtitle="%"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arduino Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            État Arduino
          </h2>
          
          {arduinoStatus ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Connexion</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  arduinoStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {arduinoStatus.connected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
              
              {arduinoStatus.port && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Port</span>
                  <span className="text-sm text-gray-900">{arduinoStatus.port}</span>
                </div>
              )}
              
              {arduinoStatus.firmware && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Firmware</span>
                  <span className="text-sm text-gray-900">{arduinoStatus.firmware}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Impossible de charger l'état Arduino</p>
          )}
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Étudiants récents
          </h2>
          
          {recentStudents.length > 0 ? (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500">{student.major}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    student.fingerprintId ? 'bg-green-400' : 'bg-red-400'
                  }`} title={student.fingerprintId ? 'Empreinte enregistrée' : 'Empreinte manquante'}></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun étudiant enregistré</p>
          )}
        </div>

        {/* Recent Professors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-green-600" />
            Professeurs récents
          </h2>
          
          {recentProfessors.length > 0 ? (
            <div className="space-y-3">
              {recentProfessors.map((professor) => (
                <div key={professor.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {professor.title} {professor.firstName} {professor.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{professor.department}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    professor.fingerprintId ? 'bg-green-400' : 'bg-red-400'
                  }`} title={professor.fingerprintId ? 'Empreinte enregistrée' : 'Empreinte manquante'}></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun professeur enregistré</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/students"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Gérer les étudiants</div>
                <div className="text-sm text-gray-500">Ajouter, modifier ou supprimer</div>
              </div>
            </div>
          </a>
          
          <a
            href="/professors"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Gérer les professeurs</div>
                <div className="text-sm text-gray-500">Ajouter, modifier ou supprimer</div>
              </div>
            </div>
          </a>
          
          <a
            href="/arduino-settings"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Configuration Arduino</div>
                <div className="text-sm text-gray-500">Gérer la connexion série</div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;