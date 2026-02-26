import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import AppShell     from './components/Layout/AppShell'
import Login        from './pages/auth/Login'
import Signup       from './pages/auth/Signup'
import OTPVerify    from './pages/auth/OTPVerify'
import Dashboard    from './pages/Dashboard'
import ClientList   from './pages/clients/ClientList'
import ClientDetail from './pages/clients/ClientDetail'
import NewClient    from './pages/clients/NewClient'
import QuoteList    from './pages/quotes/QuoteList'
import NewQuote     from './pages/quotes/NewQuote'
import PolicyList   from './pages/policies/PolicyList'
import Wallet       from './pages/wallet/Wallet'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup"     element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/verify-otp" element={<OTPVerify />} />

        {/* Protected app routes */}
        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="clients"      element={<ClientList />} />
          <Route path="clients/new"  element={<NewClient />} />
          <Route path="clients/:id"  element={<ClientDetail />} />

          <Route path="quotes"       element={<QuoteList />} />
          <Route path="quotes/new"   element={<NewQuote />} />

          <Route path="policies"     element={<PolicyList />} />
          <Route path="wallet"       element={<Wallet />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
