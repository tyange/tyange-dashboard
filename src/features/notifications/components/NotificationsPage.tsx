import BrowserAlertsSettingsSection from './BrowserAlertsSettingsSection'

export default function NotificationsPage() {
  return (
    <section class="space-y-8 pb-10" aria-label="알림">
      <header>
        <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">알림</h1>
      </header>

      <BrowserAlertsSettingsSection title="브라우저 알림" showTechnicalDetails />
    </section>
  )
}
