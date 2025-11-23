import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'


import Login from "./pages/Login"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import { UserProvider } from "./contexts/UserContexts";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/users/Users";
import ProfileManagement from "./pages/ProfileManagement";
import Promotions from "./pages/Promotions";

function App() {

  return <UserProvider>
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} /> 

        {/* Forgot Password Page */}
        <Route path="/forgot-pasword" element={<ForgotPassword />} /> 

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
            </ProtectedRoute>
          }>
          <Route index element={<Promotions />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </UserProvider>
}

export default App
