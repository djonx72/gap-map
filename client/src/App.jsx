import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import TeacherDashboardPage from './pages/TeacherDashboardPage.jsx'
import StudentDashboardPage from './pages/StudentDashboardPage.jsx'
import CreateClassPage from './pages/CreateClassPage.jsx'
import ClassDashboardPage from './pages/ClassDashboardPage.jsx'
import CreateQuestionPage from './pages/CreateQuestionPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/create-class"
          element={
            <ProtectedRoute allowedRole="teacher">
              <CreateClassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class/:id"
          element={
            <ProtectedRoute allowedRole="teacher">
              <ClassDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class/:id/create-question"
          element={
            <ProtectedRoute allowedRole="teacher">
              <CreateQuestionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
