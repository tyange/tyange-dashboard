import ApiKeysPage from '../features/api-keys/components/ApiKeysPage'
import BrowserAlertsSettingsSection from '../features/notifications/components/BrowserAlertsSettingsSection'

export default function SettingsPage() {
  return (
    <section class="space-y-8 pb-10" aria-label="설정">
      <header class="space-y-3">
        <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">설정</h1>
      </header>

      <BrowserAlertsSettingsSection title="알림" showTechnicalDetails />
      <ApiKeysPage embedded />
    </section>
  )
}
