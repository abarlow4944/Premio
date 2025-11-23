import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'


import Login from "./pages/Login"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import { UserProvider } from "./contexts/UserContexts";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/Users";
import TransactionPage from "./pages/transactions/Transactions";

function App() {

  return <UserProvider>
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} /> 

        {/* Protected Landing Page */}
        <Route path="/home" element={
            <ProtectedRoute>      
              <Layout />
            </ProtectedRoute>
          }>

          {/* Regular / Cashier / Manager / Superuser Specific Landing Page */}
          <Route index element={<Home />} />
        </Route>

        {/* Users Page */}
        <Route path="/users" element={
            <ProtectedRoute>      
              <Layout />
            </ProtectedRoute>
          }>
            
          <Route index element={<Users />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </UserProvider>
}

export default App
