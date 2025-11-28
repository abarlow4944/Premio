import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'


import Login from "./pages/Login"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import { UserProvider } from "./contexts/UserContexts";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/users/Users";
import TransactionPage from "./pages/transactions/Transactions";
import ProfileManagement from "./pages/ProfileManagement";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
import ResetPassword from "./pages/forgotPassword/ResetPassword";
import EmailConfirmation from "./pages/forgotPassword/EmailConfirmation";
import Promotions from "./pages/promotions/Promotions";
import Events from "./pages/events/Events";
import ActivateAccount from "./pages/ActivateAccount";

function App() {

  return <UserProvider>
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} /> 

        {/* Forgot Password Page */}
        <Route path="/forgot-password" element={<ForgotPassword />} /> 

        {/* Reset Password Page */}
        <Route path="/reset-password" element={<ResetPassword />} /> 

        {/* Reset Password Page */}
        <Route path="/email-confirmation" element={<EmailConfirmation />} /> 

        {/* Activate Account Page */}
        <Route path="/activate-account" element={<ActivateAccount />} /> 

        {/* Protected Landing Page */}
        <Route path="/home" element={
            <ProtectedRoute>      
              <Layout />
              <Home />
            </ProtectedRoute>
          }>
        </Route>

        {/* Profile Management Page */}
        <Route path="/profile" element={
            <ProtectedRoute>      
              <Layout />
              <ProfileManagement />
            </ProtectedRoute>
          }>
          
        </Route>

        {/* Users Page */}
        <Route path="/users" element={
            <ProtectedRoute>      
              <Layout />
              <Users />
            </ProtectedRoute>
          }>
        </Route>

        {/* Promotions Page */}
        <Route path="/promotions" element={
            <ProtectedRoute>
              <Layout />
              <Promotions />
            </ProtectedRoute>
          }>
        </Route>

        {/* Events Page */}
        <Route path="/events" element={
            <ProtectedRoute>
              <Layout />
              <Events />
            </ProtectedRoute>
          }>
        </Route>
        
        {/* Transaction Page */}
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout/>
          </ProtectedRoute>
        }>
          <Route index element={<TransactionPage />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  </UserProvider>
}

export default App
