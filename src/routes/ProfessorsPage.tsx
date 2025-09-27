import React, { useState, useEffect } from 'react';
import { Professor, professorService } from '../services/professorService';
import Table from '../components/Table';
import ProfessorForm from '../components/ProfessorForm';
import { Plus, Search, UserCheck, Fingerprint } from 'lucide-react';

const ProfessorsPage: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | undefined>();
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    try {
      setLoading(true);
      const data = await professorService.getAllProfessors();
      setProfessors(data);
    } catch (err) {
      setError('Erreur lors du chargement des professeurs');
      console.error('Failed to load professors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadProfessors();
      return;
    }

    try {
      const results = await professorService.searchProfessors(query);
      setProfessors(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleAddProfessor = () => {
    setSelectedProfessor(undefined);
    setShowForm(true);
  };

  const handleEditProfessor = (professor: Professor) => {
    setSelectedProfessor(professor);
    setShowForm(true);
  };

  const handleDeleteProfessor = async (professor: Professor) => {
    if (!professor.id) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le professeur ${professor.firstName} ${professor.lastName} ?`)) {
      try {
        await professorService.deleteProfessor(professor.id);
        await loadProfessors();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error('Failed to delete professor:', err);
      }
    }
  };

  const handleSaveProfessor = async (professor: Professor) => {
    try {
      if (professor.id) {
        await professorService.updateProfessor(professor.id, professor);
      } else {
        await professorService.createProfessor(professor);
      }
      setShowForm(false);
      await loadProfessors();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error('Failed to save professor:', err);
    }
  };

  const handleVerifyFingerprint = async (professor: Professor) => {
    if (!professor.id) return;
    
    try {
      const result = await professorService.verifyProfessorFingerprint(professor.id);
      if (result.success) {
        alert(`Empreinte vérifiée avec succès (confiance: ${result.confidence}%)`);
      } else {
        alert('Échec de la vérification de l\'empreinte');
      }
    } catch (err) {
      alert('Erreur lors de la vérification');
      console.error('Fingerprint verification failed:', err);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Titre',
    },
    {
      key: 'firstName',
      label: 'Prénom',
    },
    {
      key: 'lastName',
      label: 'Nom',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'employeeNumber',
      label: 'Numéro employé',
    },
    {
      key: 'department',
      label: 'Département',
    },
    {
      key: 'fingerprintId',
      label: 'Empreinte',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <Fingerprint className="h-3 w-3 mr-1" />
          {value ? 'Enregistrée' : 'Non enregistrée'}
        </span>
      ),
    },
  ];

  if (showForm) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedProfessor ? 'Modifier le professeur' : 'Nouveau professeur'}
            </h1>
            <p className="text-gray-600">
              {selectedProfessor ? 'Modifiez les informations du professeur' : 'Ajoutez un nouveau professeur avec vérification biométrique'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <ProfessorForm
              professor={selectedProfessor}
              onSave={handleSaveProfessor}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCheck className="h-7 w-7 mr-2 text-blue-600" />
              Gestion des professeurs
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les professeurs et leurs empreintes biométriques
            </p>
          </div>
          
          <button
            onClick={handleAddProfessor}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau professeur
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un professeur..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={professors}
        onEdit={handleEditProfessor}
        onDelete={handleDeleteProfessor}
        loading={loading}
        emptyMessage="Aucun professeur trouvé"
      />

      <div className="mt-4 text-sm text-gray-500">
        Total: {professors.length} professeur{professors.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ProfessorsPage;