import React, { useState, useEffect } from 'react';
import { Student, studentService } from '../services/studentService';
import Table from '../components/Table';
import StudentForm from '../components/StudentForm';
import { Plus, Search, Users, Fingerprint } from 'lucide-react';

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError('Erreur lors du chargement des étudiants');
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadStudents();
      return;
    }

    try {
      const results = await studentService.searchStudents(query);
      setStudents(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(undefined);
    setShowForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!student.id) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'étudiant ${student.name} ?`)) {
      try {
        await studentService.deleteStudent(student.id);
        await loadStudents();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error('Failed to delete student:', err);
      }
    }
  };

  const handleSaveStudent = async (student: Student) => {
    try {
      if (student.id) {
        await studentService.updateStudent(student.id, student);
      } else {
        await studentService.createStudent(student);
      }
      setShowForm(false);
      await loadStudents();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error('Failed to save student:', err);
    }
  };

  const handleVerifyFingerprint = async (student: Student) => {
    if (!student.id) return;
    
    try {
      const result = await studentService.verifyStudentFingerprint(student.id);
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
      key: 'firstName',
      label: 'Prénom',
      render: (_: any, row: Student) => row.name?.split(' ')[0] || '',
    },
    {
      key: 'lastName',
      label: 'Nom',
      render: (_: any, row: Student) => row.name?.split(' ').slice(1).join(' ') || '',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'studentNumber',
      label: 'Numéro étudiant',
    },
    {
      key: 'major',
      label: 'Département',
    },
    {
      key: 'year',
      label: 'Année',
      render: (value: number) => value ? `${value}ème année` : '',
    },
    {
      key: 'fingerprintId',
      label: 'Empreinte',
      render: (value: string) => value ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Fingerprint className="h-3 w-3 mr-1" />
          Enregistrée
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Fingerprint className="h-3 w-3 mr-1" />
          Non enregistrée
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
              {selectedStudent ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
            </h1>
            <p className="text-gray-600">
              {selectedStudent ? 'Modifiez les informations de l\'étudiant' : 'Ajoutez un nouvel étudiant avec vérification biométrique'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <StudentForm
              student={selectedStudent}
              onSave={handleSaveStudent}
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
              <Users className="h-7 w-7 mr-2 text-blue-600" />
              Gestion des étudiants
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les étudiants et leurs empreintes biométriques
            </p>
          </div>
          
          <button
            onClick={handleAddStudent}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel étudiant
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
            placeholder="Rechercher un étudiant..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={students}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        loading={loading}
        emptyMessage="Aucun étudiant trouvé"
      />

      <div className="mt-4 text-sm text-gray-500">
        Total: {students.length} étudiant{students.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default StudentsPage;