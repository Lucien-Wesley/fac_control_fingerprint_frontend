import React from 'react';
import { CheckCircle, XCircle, Loader2, Fingerprint, AlertCircle } from 'lucide-react';
import { BiometricStatus } from '../services/studentService';

interface FingerprintStatusProps {
  status: BiometricStatus;
  onRetry?: () => void;
  onCancel?: () => void;
}

const FingerprintStatus: React.FC<FingerprintStatusProps> = ({
  status,
  onRetry,
  onCancel
}) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'waiting':
        return <Fingerprint className="h-8 w-8 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'retry':
        return <AlertCircle className="h-8 w-8 text-orange-500" />;
      default:
        return <Fingerprint className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'waiting':
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'retry':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getProgressPercentage = () => {
    if (status.maxAttempts === 0) return 0;
    return ((status.attempts / status.maxAttempts) * 100);
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()} transition-all duration-300`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Vérification Biométrique
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {status.message}
        </p>

        {status.maxAttempts > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tentative {status.attempts} sur {status.maxAttempts}</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-3">
          {status.status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Réessayer
            </button>
          )}
          
          {(status.status === 'waiting' || status.status === 'processing' || status.status === 'retry') && onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FingerprintStatus;