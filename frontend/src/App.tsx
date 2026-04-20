import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const MeetingDetails = lazy(() => import('./pages/Meetings/MeetingDetails'));
const PublicPortal = lazy(() => import('./pages/Public/PublicPortal'));
const PublicAgendaDetails = lazy(() => import('./pages/Public/PublicAgendaDetails'));
const InCameraPortal = lazy(() => import('./pages/Meetings/InCameraPortal'));
const MeetingsList = lazy(() => import('./pages/Meetings/MeetingsList'));
const AgendaList = lazy(() => import('./pages/Agendas/AgendaList'));
const ReportList = lazy(() => import('./pages/Reports/ReportList'));
const LiveMotionsConsole = lazy(() => import('./pages/Motions/LiveMotionsConsole'));
const DirectorApprovalQueue = lazy(() => import('./pages/Approvals/DirectorApprovalQueue'));
const CaoApprovalQueue = lazy(() => import('./pages/Approvals/CaoApprovalQueue'));
const MyApprovalQueue = lazy(() => import('./pages/Approvals/MyApprovalQueue'));
const MinutesRegister = lazy(() => import('./pages/Minutes/MinutesRegister'));
const UsersAdmin = lazy(() => import('./pages/Admin/UsersAdmin'));
const RolesAdmin = lazy(() => import('./pages/Admin/RolesAdmin'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminPortalHome = lazy(() => import('./pages/Admin/AdminPortalHome'));
const TemplatesAdmin = lazy(() => import('./pages/Admin/TemplatesAdmin'));
const NotificationsAdmin = lazy(() => import('./pages/Admin/NotificationsAdmin'));
const ApiSettingsAdmin = lazy(() => import('./pages/Admin/ApiSettingsAdmin'));
const AuditLogsAdmin = lazy(() => import('./pages/Admin/AuditLogsAdmin'));
const MeetingTypesAdmin = lazy(() => import('./pages/Admin/MeetingTypesAdmin'));
const ExecutiveKpisDashboard = lazy(() => import('./pages/Admin/ExecutiveKpisDashboard'));
const WorkflowsAdmin = lazy(() => import('./pages/Admin/WorkflowsAdmin'));
const ResolutionsRegister = lazy(() => import('./pages/Resolutions/ResolutionsRegister'));
const ActionTracker = lazy(() => import('./pages/Actions/ActionTracker'));
const PublicLiveMotionScreen = lazy(() => import('./pages/Public/PublicLiveMotionScreen'));
const PublicLiveMeetingScreen = lazy(() => import('./pages/Public/PublicLiveMeetingScreen'));
const ParticipantPortal = lazy(() => import('./pages/Participant/ParticipantPortal'));
const ParticipantMeetingView = lazy(() => import('./pages/Participant/ParticipantMeetingView'));
const ParticipantAgendaView = lazy(() => import('./pages/Participant/ParticipantAgendaView'));
const AttendanceReport = lazy(() => import('./pages/Reports/AttendanceReport'));
const MotionReport = lazy(() => import('./pages/Reports/MotionReport'));
const VotingReport = lazy(() => import('./pages/Reports/VotingReport'));
const ConflictReport = lazy(() => import('./pages/Reports/ConflictReport'));
const ForecastReport = lazy(() => import('./pages/Reports/ForecastReport'));
import ProtectedRoute from './guards/ProtectedRoute';
import PermissionRoute from './guards/PermissionRoute';
import AdminAccessRoute from './guards/AdminAccessRoute';

export default function App(): JSX.Element {
  return (
    <Suspense fallback={<div style={{ padding: '1rem' }}>Loading...</div>}>
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
        path="/reports/attendance"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <AttendanceReport />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/motions"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <MotionReport />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/voting"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <VotingReport />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/conflicts"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <ConflictReport />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/forecast"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <ForecastReport />
            </PermissionRoute>
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
        path="/resolutions"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="resolution.manage">
              <ResolutionsRegister />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/actions"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="action.manage">
              <ActionTracker />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/my"
        element={
          <ProtectedRoute>
            <MyApprovalQueue />
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
        path="/admin-portal/workflows"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <PermissionRoute requiredPermission="templates.manage">
                <WorkflowsAdmin />
              </PermissionRoute>
            </AdminAccessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-portal/audit-logs"
        element={
          <ProtectedRoute>
            <AdminAccessRoute>
              <PermissionRoute requiredPermission="public.publish">
                <AuditLogsAdmin />
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
      <Route
        path="/participant"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <ParticipantPortal />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/participant/meetings/:meetingId"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <ParticipantMeetingView />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/participant/agendas/:agendaItemId"
        element={
          <ProtectedRoute>
            <PermissionRoute requiredPermission="meeting.read">
              <ParticipantAgendaView />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
