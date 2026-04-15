import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/Leads/LeadList';
import LeadDetail from './pages/Leads/LeadDetail';
import DistrictList from './pages/Districts/DistrictList';
import FranchiseeList from './pages/Franchisees/FranchiseeList';
import FranchiseeDetail from './pages/Franchisees/FranchiseeDetail';
import FranchiseActivations from './pages/Franchisees/FranchiseActivations';
import MeetingList from './pages/Meetings/MeetingList';
import TaskList from './pages/Tasks/TaskList';
import Reports from './pages/Reports/Reports';
import FranchiseTool from './pages/FranchiseTool';
import UserList from './pages/Users/UserList';
import AISettings from './pages/Settings/AISettings';
import ToastContainer from './components/UI/ToastContainer';
import AIChatWidget from './components/UI/AIChatWidget';

import PublicQualification from './pages/Leads/PublicQualification';

import QualificationList from './pages/Leads/QualificationList';

function ProtectedApp() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<LeadList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/qualifications" element={<QualificationList />} />
        <Route path="/districts" element={<DistrictList />} />
        <Route path="/franchisees" element={<FranchiseeList />} />
        <Route path="/franchisees/:id" element={<FranchiseeDetail />} />
        <Route path="/activations" element={<FranchiseActivations />} />
        <Route path="/meetings" element={<MeetingList />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/franchise-tool" element={<FranchiseTool />} />
        <Route path="/ai-settings" element={<AISettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChatWidget />
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/qualify/:id" element={<PublicQualification />} />
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
          <ToastContainer />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
