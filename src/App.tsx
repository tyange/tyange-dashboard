import { Navigate, Route, Router } from '@solidjs/router'
import type { ParentProps } from 'solid-js'
import PWABadge from './PWABadge'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import AppFooter from './components/AppFooter'
import BudgetSetupPage from './features/budget/components/BudgetSetupPage'
import SpendRecordsRoutePage from './features/budget/components/SpendRecordsRoutePage'
import MatchPage from './features/match/components/MatchPage'
import FeedHomePage from './features/notifications/components/FeedHomePage'
import NotificationsPage from './features/notifications/components/NotificationsPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import SignupPage from './pages/SignupPage'
import { ThemeProvider } from './theme/ThemeProvider'

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
    <ThemeProvider>
      <AuthProvider>
        <Router root={AppShell}>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route
            path="/dashboard"
            component={() => (
              <ProtectedAppShell>
                <FeedHomePage />
              </ProtectedAppShell>
            )}
          />
          <Route
            path="/subscriptions"
            component={() => (
              <ProtectedAppShell>
                <NotificationsPage />
              </ProtectedAppShell>
            )}
          />
          <Route
            path="/settings"
            component={() => (
              <ProtectedAppShell>
                <SettingsPage />
              </ProtectedAppShell>
            )}
          />
          <Route
            path="/budget/setup"
            component={() => (
              <ProtectedAppShell>
                <BudgetSetupPage />
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
          <Route
            path="/match"
            component={() => (
              <ProtectedAppShell>
                <MatchPage />
              </ProtectedAppShell>
            )}
          />
          <Route path="/api-keys" component={() => <Navigate href="/settings" />} />
          <Route path="/notifications" component={() => <Navigate href="/subscriptions" />} />
          <Route path="/feed" component={() => <Navigate href="/dashboard" />} />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
