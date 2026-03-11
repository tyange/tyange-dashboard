import { A } from '@solidjs/router'

type BudgetSetupRequiredStateProps = {
  title?: string
  description?: string
}

export default function BudgetSetupRequiredState(props: BudgetSetupRequiredStateProps) {
  return (
    <section
      aria-label="예산 등록 필요 안내"
      class="rounded-xl border border-border bg-card p-6 shadow-[0_10px_24px_rgba(2,6,23,0.22)]"
    >
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Budget Setup</p>
      <h2 class="mt-3 text-xl font-semibold text-foreground">{props.title ?? '활성 예산을 먼저 등록해주세요.'}</h2>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">
        {props.description ?? '현재 활성 기간 예산이 없습니다. 설정 페이지에서 기간 총예산을 생성하거나 계산 결과를 검토한 뒤 직접 저장해주세요.'}
      </p>
      <div class="mt-5">
        <div class="flex flex-wrap items-center gap-3">
          <A
            href="/budget/setup"
            class="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5"
          >
            예산 등록하기
          </A>
          <A
            href="/"
            class="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            메인으로
          </A>
        </div>
      </div>
    </section>
  )
}
