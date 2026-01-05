import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import AddClientPage from './pages/AddClientPage'
import EditClientPage from './pages/EditClientPage'
import AddProgramPage from './pages/AddProgramPage'
import EditProgramPage from './pages/EditProgramPage'
import SessionCollectPage from './pages/SessionCollectPage'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import NewSessionPage from './pages/NewSessionPage'
import ProgramsPage from './pages/ProgramsPage'
import ProgressPage from './pages/ProgressPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          {/* Clients Routes */}
          <Route path="/clients" element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          } />
          <Route path="/clients/new" element={
            <ProtectedRoute>
              <AddClientPage />
            </ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute>
              <ClientDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/clients/:id/edit" element={
            <ProtectedRoute>
              <EditClientPage />
            </ProtectedRoute>
          } />
          <Route path="/clients/:clientId/programs/new" element={
            <ProtectedRoute>
              <AddProgramPage />
            </ProtectedRoute>
          } />

          {/* Programs Routes */}
          <Route path="/programs" element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          } />
          <Route path="/programs/new" element={
            <ProtectedRoute>
              <AddProgramPage />
            </ProtectedRoute>
          } />
          <Route path="/programs/:id" element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          } />
          <Route path="/programs/:id/progress" element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          } />
          <Route path="/programs/:id/edit" element={
            <ProtectedRoute>
              <EditProgramPage />
            </ProtectedRoute>
          } />

          {/* Sessions Routes */}
          <Route path="/sessions" element={
            <ProtectedRoute>
              <SessionsPage />
            </ProtectedRoute>
          } />
          <Route path="/sessions/new" element={
            <ProtectedRoute>
              <NewSessionPage />
            </ProtectedRoute>
          } />
          <Route path="/sessions/new/collect" element={
            <ProtectedRoute>
              <SessionCollectPage />
            </ProtectedRoute>
          } />
          <Route path="/sessions/:id" element={
            <ProtectedRoute>
              <SessionDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/sessions/:id/collect" element={
            <ProtectedRoute>
              <SessionCollectPage />
            </ProtectedRoute>
          } />

          {/* Reports Route */}
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          } />

          {/* Settings Route */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
