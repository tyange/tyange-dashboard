import { A } from '@solidjs/router'

type BudgetSetupRequiredStateProps = {
  title?: string
  description?: string
}

export default function BudgetSetupRequiredState(props: BudgetSetupRequiredStateProps) {
  return (
    <section
      aria-label="예산 등록 필요 안내"
      class="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_96%,white),color-mix(in_oklab,var(--card)_88%,var(--background)))] p-7 shadow-[0_18px_44px_color-mix(in_srgb,var(--shadow-color)_16%,transparent)]"
    >
      <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Budget Setup</p>
      <h2 class="mt-4 text-2xl font-semibold tracking-tight text-foreground">{props.title ?? '현재 예산을 먼저 등록해주세요.'}</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {props.description ?? '현재 적용 예산이 없습니다. 설정 페이지에서 기간 총예산을 생성하거나 계산 결과를 검토한 뒤 직접 저장해주세요.'}
      </p>
      <div class="mt-7 flex flex-wrap items-center gap-3">
          <A
            href="/budget/setup"
            class="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:-translate-y-0.5"
          >
            예산 등록하기
          </A>
          <A
            href="/"
            class="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/82 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            메인으로
          </A>
      </div>
    </section>
  )
}
