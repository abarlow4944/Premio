import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Pages
import Login from "./pages/Login"
import Layout from "./components/Layout"
import Home from "./pages/Home"

function App() {

  return (
     <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} /> 

        {/* Protected Landing Page */}
        <Route path="/home" element={<Layout />} >

          {/* Regular / Cashier / Manager / Superuser Specific Landing Page */}
          <Route index element={<Home />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
