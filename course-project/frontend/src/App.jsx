import { Routes, Route } from "react-router-dom"
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Pages
import Login from "./pages/Login"

function App() {
  const [count, setCount] = useState(0)

  return (
    <Login />
  )
}

export default App
