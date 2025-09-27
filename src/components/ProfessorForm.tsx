import React, { useState, useEffect } from 'react';
import { Professor, professorService } from '../services/professorService';
import FingerprintStatus from './FingerprintStatus';
import { Save, X, Fingerprint } from 'lucide-react';

interface ProfessorFormProps {
  professor?: Professor;
  onSave: (professor: Professor) => void;
  onCancel: () => void;
}

const ProfessorForm: React.FC<ProfessorFormProps> = ({ professor, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Professor, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    employeeNumber: '',
    department: '',
    title: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Professor>>({});

  const titles = [
    'Professeur',
    'Professeur Associé',
    'Professeur Assistant',
    'Maître de Conférences',
    'Chargé de Cours',
    'Docteur',
    'Autre'
  ];

  useEffect(() => {
    if (professor) {
      setFormData({
        firstName: professor.firstName,
        lastName: professor.lastName,
        email: professor.email,
        employeeNumber: professor.employeeNumber,
        department: professor.department,
        title: professor.title,
      });
    }
  }, [professor]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Professor> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    if (!formData.employeeNumber.trim()) newErrors.employeeNumber = 'Le numéro employé est requis';
    if (!formData.department.trim()) newErrors.department = 'Le département est requis';
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof Professor]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const startBiometricEnrollment = async (professorId: number) => {
    try {
      const response = await professorService.startBiometricEnrollment(professorId);
      if (response.success) {
        setSessionId(response.sessionId);
        setShowBiometric(true);
        pollBiometricStatus(response.sessionId);
      }
    } catch (error) {
      console.error('Failed to start biometric enrollment:', error);
    }
  };

  const pollBiometricStatus = async (sessionId: string) => {
    const poll = async () => {
      try {
        const status = await professorService.getBiometricStatus(sessionId);
        setBiometricStatus(status);

        if (status.status === 'success') {
          onSave({ ...formData, id: professor?.id } as Professor);
          setShowBiometric(false);
        } else if (status.status === 'waiting' || status.status === 'processing' || status.status === 'retry') {
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('Failed to get biometric status:', error);
      }
    };
    poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (professor) {
        const updatedProfessor = await professorService.updateProfessor(professor.id!, formData);
        onSave(updatedProfessor);
      } else {
        const newProfessor = await professorService.createProfessor(formData);
        await startBiometricEnrollment(newProfessor.id!);
      }
    } catch (error) {
      console.error('Failed to save professor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricRetry = () => {
    if (sessionId) {
      pollBiometricStatus(sessionId);
    }
  };

  const handleBiometricCancel = async () => {
    if (sessionId) {
      await professorService.cancelBiometricSession(sessionId);
    }
    setShowBiometric(false);
    setBiometricStatus(null);
    setSessionId('');
  };

  if (showBiometric && biometricStatus) {
    return (
      <div className="max-w-md mx-auto">
        <FingerprintStatus
          status={biometricStatus}
          onRetry={handleBiometricRetry}
          onCancel={handleBiometricCancel}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Entrez le prénom"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Entrez le nom"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="exemple@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro employé *
          </label>
          <input
            type="text"
            id="employeeNumber"
            name="employeeNumber"
            value={formData.employeeNumber}
            onChange={handleInputChange}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.employeeNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Ex: EMP2024001"
          />
          {errors.employeeNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre *
          </label>
          <select
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionnez un titre</option>
            {titles.map(title => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
          Département *
        </label>
        <input
          type="text"
          id="department"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.department ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ex: Informatique"
        />
        {errors.department && (
          <p className="mt-1 text-sm text-red-600">{errors.department}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {professor ? 'Modification...' : 'Ajout...'}
            </>
          ) : (
            <>
              {professor ? <Save className="h-4 w-4 mr-2" /> : <Fingerprint className="h-4 w-4 mr-2" />}
              {professor ? 'Modifier' : 'Ajouter avec empreinte'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfessorForm;