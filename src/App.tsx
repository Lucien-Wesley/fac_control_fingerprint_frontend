import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './routes/LoginPage';
import Dashboard from './routes/Dashboard';
import StudentsPage from './routes/StudentsPage';
import ProfessorsPage from './routes/ProfessorsPage';
import ArduinoSettingsPage from './routes/ArduinoSettingsPage';
import AccessLogsPage from './routes/AccessLogsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/professors" element={<ProfessorsPage />} />
                    <Route path="/arduino-settings" element={<ArduinoSettingsPage />} />
                    <Route path="/access-logs" element={<AccessLogsPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;