import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import TeacherDashboardPage from './pages/TeacherDashboardPage.jsx'
import StudentDashboardPage from './pages/StudentDashboardPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboardPage />} />
      <Route path="/student-dashboard" element={<StudentDashboardPage />} />
    </Routes>
  )
}
