// File: src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Catalog from './pages/public/Catalog';

import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import StudentGrades from './pages/student/StudentGrades';
import CourseDetail from './pages/student/CourseDetail';
import ProfileSettings from './pages/ProfileSettings';

export function App() {
  useEffect(() => {
    const saved = localStorage.getItem('pfe-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const isDark = saved === 'dark' || (saved !== 'light' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col transition-colors">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto p-6">
              <Routes>
                <Route path="/" element={<Catalog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute allowedRoles={['ETUDIANT', 'ENSEIGNANT', 'ADMIN']} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/notes" element={<StudentGrades />} />
                  <Route path="/cours/:id" element={<CourseDetail />} />
                  <Route path="/profil" element={<ProfileSettings />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ENSEIGNANT', 'ADMIN']} />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
