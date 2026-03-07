import { Route, Router } from '@solidjs/router'
import type { ParentProps } from 'solid-js'
import PWABadge from './PWABadge'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import AppFooter from './components/AppFooter'
import BudgetDashboardPage from './features/budget/components/BudgetDashboardPage'
import SpendRecordsRoutePage from './features/budget/components/SpendRecordsRoutePage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

function AppShell(props: ParentProps) {
  return (
    <div class="flex min-h-screen flex-col bg-background text-foreground">
      <div class="flex-1">{props.children}</div>
      <AppFooter />
      <PWABadge />
    </div>
  )
}

function ProtectedAppShell(props: ParentProps) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>{props.children}</AuthenticatedLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router root={AppShell}>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route
          path="/dashboard"
          component={() => (
            <ProtectedAppShell>
              <BudgetDashboardPage />
            </ProtectedAppShell>
          )}
        />
        <Route
          path="/records"
          component={() => (
            <ProtectedAppShell>
              <SpendRecordsRoutePage />
            </ProtectedAppShell>
          )}
        />
      </Router>
    </AuthProvider>
  )
}

export default App
