import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AdminConfig } from './AdminConfig.tsx'
import { StaffDashboard } from './StaffDashboard.tsx'
import { StaffLogin } from './StaffLogin.tsx'

const path = window.location.pathname
const page =
  path === '/admin-config' ? <AdminConfig /> :
  path === '/staff' ? <StaffDashboard /> :
  path === '/' ? <StaffLogin /> :
  <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
