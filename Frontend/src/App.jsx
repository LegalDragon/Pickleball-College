import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Marketplace from './pages/Marketplace'
import SessionScheduler from './pages/SessionScheduler'
import MaterialCreator from './pages/MaterialCreator'
import EditMaterial from './pages/EditMaterial'
import MaterialDetail from './pages/MaterialDetail'
import CourseCreator from './pages/CourseCreator'
import CourseEditor from './pages/CourseEditor'
import CourseDetail from './pages/CourseDetail'
import CoachDashboard from './pages/CoachDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard' // Add this import
import Profile from './pages/Profile' // Add this import
import Notifications from './pages/Notifications' // Add this import
import ProtectedRoute from './components/ProtectedRoute'

import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/Marketplace" element={<Marketplace />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
     <Route path="/coach/materials/edit/:id" element={<EditMaterial />} />
<Route path="/coach/materials/:id" element={<MaterialDetail />} /> {/* Optional */}


      {/* Protected Routes - Role Specific */}
      <Route path="/coach/dashboard" element={
        <ProtectedRoute role="Coach">
          <CoachDashboard />
        </ProtectedRoute>
      } />
<Route path="/SessionScheduler" element={
        <ProtectedRoute role="Coach">
          <SessionScheduler />
        </ProtectedRoute>
      } />
<Route path="/Coach/Materials/Create" element={
        <ProtectedRoute role="Coach">
          <MaterialCreator />
        </ProtectedRoute>
      } />

      <Route path="/coach/courses/create" element={
        <ProtectedRoute role="Coach">
          <CourseCreator />
        </ProtectedRoute>
      } />

      <Route path="/coach/courses/edit/:id" element={
        <ProtectedRoute role="Coach">
          <CourseEditor />
        </ProtectedRoute>
      } />

      <Route path="/student/dashboard" element={
        <ProtectedRoute role="Student">
          <StudentDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="Admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Protected Routes - Any Authenticated User */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App