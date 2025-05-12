import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import './index.css'
import './globalFetch.js'
import LoginPage from './pages/LoginPage'
import DashBoard from './pages/Dashboard'
import Layout from './layouts/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ProjectDetails from './pages/ProjectDetails'
import ExpensesPage from './pages/Expenses'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ReimbursementPage from './pages/Reimbursement'
import MembersView from './components/MembersView'
import ExpensesLayout from './layouts/ExpenseLayout'
import ProjectOverview from './pages/ProjectOverview'
import AdminPage from './pages/AdminPage'
import AccountPage from './pages/AccountPage'
import PDAccountPage from './pages/PDAccountPage'
import NotFound from './components/NotFound'
import DeveloperPage from './pages/DeveloperPage'
import { InstituteExpensesPage } from './pages/InstituteExpenses.js'
import { ProjectSAViewer } from './pages/ProjectSAViewer,.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CID}>
    <ToastContainer />
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute homePage={true} />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path='/dashboard' element={<DashBoard />} />
            <Route path='/projects' element={<ProjectOverview />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/project/:id/accounts/pdfviewer" element={<ProjectSAViewer />} />
            <Route path='/expenses' element={<ExpensesLayout />}>
              <Route index element={<ExpensesPage />} />
              <Route path='member-wise' element={<MembersView />} />
              <Route path='institute' element={<InstituteExpensesPage />} />
            </Route>
            <Route path='/reimbursements' element={<ReimbursementPage />} />
            <Route path='/admin' element={<AdminPage />} />
            <Route path="/account/savings" element={<AccountPage type='Savings'/>} />
            <Route path="/account/current" element={<AccountPage type='Current'/>} />
            <Route path="/pda" element={<PDAccountPage type='PDA'/>} />
            <Route path="/pdf" element={<PDAccountPage type='PDF'/>} />
            <Route path='/developers' element={<DeveloperPage />} />
          </Route>
          <Route path='/login' element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
)