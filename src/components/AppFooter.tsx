import { getYear } from 'date-fns'

export default function AppFooter() {
  const currentYear = getYear(new Date())

  return (
    <footer class="mx-auto w-full max-w-5xl px-4 pb-6 pt-10 text-center text-sm text-muted-foreground md:px-8">
      <span>Copyright &copy; {currentYear} </span>
      <a
        href="https://github.com/tyange"
        target="_blank"
        rel="noreferrer"
        class="transition-colors hover:text-foreground"
      >
        tyange
      </a>
    </footer>
  )
}
