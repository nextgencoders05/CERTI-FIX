import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import VerifyCertificatePage from './pages/public/VerifyCertificatePage'
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage'
import TermsPage from './pages/public/TermsPage'
import ContactPage from './pages/public/ContactPage'
import TemplateGalleryPage from './pages/public/TemplateGalleryPage'
import TemplateDraftEditorPage from './pages/public/TemplateDraftEditorPage'

import UserDashboard from './pages/user/UserDashboard'
import CertificateUploadPage from './pages/user/CertificateUploadPage'
import OCRResultsPage from './pages/user/OCRResultsPage'
import CertificateCorrectionPage from './pages/user/CertificateCorrectionPage'
import CorrectionTrackingPage from './pages/user/CorrectionTrackingPage'
import UserProfilePage from './pages/user/UserProfilePage'

import OrgDashboard from './pages/organization/OrgDashboard'
import CertificateCreationPage from './pages/organization/CertificateCreationPage'
import TemplateManagementPage from './pages/organization/TemplateManagementPage'
import OrgCorrectionReviewPage from './pages/organization/OrgCorrectionReviewPage'
import OrgCertificatesPage from './pages/organization/OrgCertificatesPage'
import OrgProfilePage from './pages/organization/OrgProfilePage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrgsPage from './pages/admin/AdminOrgsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminRequestsPage from './pages/admin/AdminRequestsPage'
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyCertificatePage />} />
            <Route path="/verify/:uid" element={<VerifyCertificatePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/templates" element={<TemplateGalleryPage />} />
            <Route path="/templates/edit/:templateId" element={<TemplateDraftEditorPage />} />
          </Route>

          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['public_user']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="upload" element={<CertificateUploadPage />} />
            <Route path="ocr/:uploadId" element={<OCRResultsPage />} />
            <Route path="correction/new/:uploadId" element={<CertificateCorrectionPage />} />
            <Route path="corrections" element={<CorrectionTrackingPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          <Route
            path="/org"
            element={
              <ProtectedRoute allowedRoles={['organization']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<OrgDashboard />} />
            <Route path="issue" element={<CertificateCreationPage />} />
            <Route path="certificates" element={<OrgCertificatesPage />} />
            <Route path="templates" element={<TemplateManagementPage />} />
            <Route path="corrections" element={<OrgCorrectionReviewPage />} />
            <Route path="profile" element={<OrgProfilePage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="organizations" element={<AdminOrgsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
