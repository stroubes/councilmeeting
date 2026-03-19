import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MeetingDetails from './pages/Meetings/MeetingDetails';
import PublicPortal from './pages/Public/PublicPortal';
import PublicAgendaDetails from './pages/Public/PublicAgendaDetails';
import InCameraPortal from './pages/Meetings/InCameraPortal';
import MeetingsList from './pages/Meetings/MeetingsList';
import AgendaList from './pages/Agendas/AgendaList';
import ReportList from './pages/Reports/ReportList';
import LiveMotionsConsole from './pages/Motions/LiveMotionsConsole';
import DirectorApprovalQueue from './pages/Approvals/DirectorApprovalQueue';
import CaoApprovalQueue from './pages/Approvals/CaoApprovalQueue';
import MinutesRegister from './pages/Minutes/MinutesRegister';
import UsersAdmin from './pages/Admin/UsersAdmin';
import RolesAdmin from './pages/Admin/RolesAdmin';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminPortalHome from './pages/Admin/AdminPortalHome';
import TemplatesAdmin from './pages/Admin/TemplatesAdmin';
import NotificationsAdmin from './pages/Admin/NotificationsAdmin';
import ApiSettingsAdmin from './pages/Admin/ApiSettingsAdmin';
import MeetingTypesAdmin from './pages/Admin/MeetingTypesAdmin';
import ExecutiveKpisDashboard from './pages/Admin/ExecutiveKpisDashboard';
import PublicLiveMotionScreen from './pages/Public/PublicLiveMotionScreen';
import PublicLiveMeetingScreen from './pages/Public/PublicLiveMeetingScreen';
import ProtectedRoute from './guards/ProtectedRoute';
import PermissionRoute from './guards/PermissionRoute';
import AdminAccessRoute from './guards/AdminAccessRoute';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings/:meetingId"
        element={
          <ProtectedRoute>
            <MeetingDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings"
        element={
          <ProtectedRoute>
            <MeetingsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agendas"
        element={
          <ProtectedRoute>
            <AgendaList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/motions"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="agenda.write">
              <LiveMotionsConsole />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/director"
        element={
          <ProtectedRoute>
            <DirectorApprovalQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/cao"
        element={
          <ProtectedRoute>
            <CaoApprovalQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/minutes"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="minutes.write">
              <MinutesRegister />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <AdminPortalHome />
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/users"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <PermissionRoute requiredPermission="users.manage">
                <UsersAdmin />
              </PermissionRoute>
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/roles"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <PermissionRoute requiredPermission="roles.manage">
                <RolesAdmin />
              </PermissionRoute>
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/templates"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <PermissionRoute requiredPermission="templates.manage">
                <TemplatesAdmin />
              </PermissionRoute>
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/executive-kpis"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <ExecutiveKpisDashboard />
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/notifications"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <NotificationsAdmin />
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/meeting-types"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <PermissionRoute requiredPermission="templates.manage">
                <MeetingTypesAdmin />
              </PermissionRoute>
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/api-settings"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <ApiSettingsAdmin />
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/users" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/roles" element={<Navigate to="/admin/login" replace />} />
      <Route path="/public" element={<PublicPortal />} />
      <Route path="/public/agendas/:agendaId" element={<PublicAgendaDetails />} />
      <Route path="/public/live-meeting/:meetingId" element={<PublicLiveMeetingScreen />} />
      <Route path="/public/live-motion/:meetingId" element={<PublicLiveMotionScreen />} />
      <Route
        path="/in-camera"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read.in_camera">
              <InCameraPortal />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
