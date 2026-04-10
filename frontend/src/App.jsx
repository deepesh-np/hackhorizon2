import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './Context/AuthContext'
import './index.css'

// Layouts
import MainLayout from './Layouts/MainLayout'

// Pages
import Landing from './Pages/Landing'
import Home from './Pages/Home'
import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import MedicineDetail from './Pages/MedicineDetail'
import Prescriptions from './Pages/Prescriptions'
import Profile from './Pages/Profile'
import AdminDashboard from './Pages/Admin/AdminDashboard'

// Vendor
import { VendorDashboard } from './vendor/pages'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container" style={{ fontFamily: "'Inter', sans-serif" }}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Landing />} />
              <Route path="home" element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="medicine/:id" element={<MedicineDetail />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
            {/* Vendor dashboard uses its own full-screen layout (no Navbar/Footer) */}
            <Route path="/vendor" element={<VendorDashboard />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
