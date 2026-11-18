// File: src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Catalog from './pages/public/Catalog';

// Role-based Dashboards
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import StudentGrades from './pages/student/StudentGrades';
import CourseDetail from './pages/student/CourseDetail';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Catalog />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Shared Protected Routes (Accessible by Students, Teachers & Admins) */}
              <Route element={<ProtectedRoute allowedRoles={['etudiant', 'enseignant', 'admin']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/notes" element={<StudentGrades />} />
                <Route path="/cours/:id" element={<CourseDetail />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['enseignant', 'admin']} />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
