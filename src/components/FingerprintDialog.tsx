import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { Student, studentService } from '../services/studentService';

interface Props {
  student: Student;
  onClose: () => void;
}

const FingerprintDialog: React.FC<Props> = ({ student, onClose }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!student?.id) return;
    startEnrollment(student.id);
  }, [student]);

  const startEnrollment = async (id: number) => {
    setMessages([]);
    setLoading(true);
    try {
      await studentService.startBiometricEnrollment(id);
      pollMessages();
    } catch (err) {
      addMessage('Erreur: impossible de démarrer l’enregistrement.');
      setLoading(false);
    }
  };

  const pollMessages = async () => {
    const interval = setInterval(async () => {
      try {
        const res = await studentService.getBiometricStatus();
        const msg = res.last_message || '';
        console.log('Biometric status message:', msg);
        if (msg.includes('INFO')) {
          addMessage(msg);
        }
        if (msg.includes('SUCCES') || msg.includes('ECHEC') || msg.includes('ABANDONNE')) {
          clearInterval(interval);
          await studentService.verifyStudentFingerprint();
          setCompleted(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);
  };

  const addMessage = (msg: string) => {
    setMessages((prev) => {
      if (prev[prev.length - 1] !== msg) return [...prev, msg];
      return prev;
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-800/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold">Enregistrement de l’empreinte</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-600 hover:text-black" />
          </button>
        </div>

        <div className="p-4 space-y-2 h-64 overflow-y-auto bg-gray-50 rounded-b-xl">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">En attente des messages de l’Arduino...</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`text-sm ${msg.includes('SUCCES') ? 'text-green-600' : msg.includes('ECHEC') ? 'text-red-600' : 'text-gray-700'}`}>
                {msg}
              </div>
            ))
          )}
        </div>

        <div className="p-4 flex justify-end space-x-2">
          {loading && <span className="text-sm text-blue-500">En cours...</span>}
          {completed && (
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FingerprintDialog;
