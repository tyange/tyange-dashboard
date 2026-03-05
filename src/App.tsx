import PWABadge from './PWABadge'

type CardSize = 'sm' | 'md' | 'lg'
type CardTone = 'sky' | 'mint' | 'slate'

type DashboardCard = {
  id: string
  title: string
  value: string
  size: CardSize
  tone: CardTone
  items?: string[]
}

const cards: DashboardCard[] = [
  { id: 'card-1', title: 'Users', value: '1,024', size: 'sm', tone: 'sky' },
  { id: 'card-2', title: 'Revenue', value: '$12,340', size: 'md', tone: 'mint' },
  { id: 'card-3', title: 'Conversion', value: '3.4%', size: 'sm', tone: 'slate' },
  {
    id: 'card-4',
    title: 'Activity',
    value: 'Recent events',
    size: 'lg',
    tone: 'sky',
    items: ['User signed up', 'Payment completed', 'Report generated'],
  },
  { id: 'card-5', title: 'Latency', value: '92ms', size: 'md', tone: 'mint' },
  { id: 'card-6', title: 'Error Rate', value: '0.21%', size: 'sm', tone: 'slate' },
  { id: 'card-7', title: 'Sessions', value: '5,807', size: 'lg', tone: 'sky' },
]

const sizeClassByKey = {
  sm: 'min-h-28',
  md: 'min-h-40',
  lg: 'min-h-56',
} as const

const toneClassByKey = {
  sky: 'bg-gradient-to-b from-white to-sky-50',
  mint: 'bg-gradient-to-b from-white to-emerald-50',
  slate: 'bg-gradient-to-b from-white to-slate-50',
} as const

function App() {
  return (
    <div class="flex min-h-screen flex-col bg-[radial-gradient(circle_at_12%_12%,rgba(137,199,255,0.35),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(143,230,184,0.25),transparent_40%),linear-gradient(180deg,#ecf3ff,#eefbf3)] text-slate-900">
      <main class="flex flex-1 items-center justify-center p-6 max-[820px]:p-4">
        <section aria-label="Dashboard" class="w-full max-w-[720px]">
          <section aria-label="Dashboard cards" class="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {cards.map((card) => (
              <article
                id={card.id}
                class={`mb-4 break-inside-avoid rounded-2xl border border-slate-200 p-4 shadow-[0_10px_30px_rgba(29,41,57,0.10)] ${sizeClassByKey[card.size]} ${toneClassByKey[card.tone]}`}
              >
                <p class="m-0 text-xs uppercase tracking-[0.04em] text-slate-500">{card.title}</p>
                <p class="mt-2 mb-0 text-3xl leading-none font-bold tracking-tight tabular-nums">{card.value}</p>
                {card.items && (
                  <ul class="mt-3 flex list-none flex-col gap-2 p-0">
                    {card.items.map((item) => (
                      <li class="relative pl-3 text-sm before:absolute before:left-0 before:top-[7px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-teal-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        </section>
      </main>

      <footer class="flex h-12 items-center justify-center text-[13px] text-slate-500">
        <p class="m-0">© 2026 Your Company</p>
      </footer>

      <PWABadge />
    </div>
  )
}

export default App
