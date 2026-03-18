export type GoogleCredentialResponse = {
  credential: string
  select_by?: string
}

type GoogleButtonConfiguration = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

type GoogleIdConfiguration = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  ux_mode?: 'popup' | 'redirect'
  auto_select?: boolean
  use_fedcm_for_prompt?: boolean
}

type GoogleIdentityAccounts = {
  initialize: (configuration: GoogleIdConfiguration) => void
  renderButton: (element: HTMLElement, configuration: GoogleButtonConfiguration) => void
}

type GoogleNamespace = {
  accounts: {
    id: GoogleIdentityAccounts
  }
}

declare global {
  interface Window {
    google?: GoogleNamespace
  }
}

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services'
const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

let googleIdentityScriptPromise: Promise<void> | null = null

export function getGoogleClientId() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  console.log("[v0] VITE_GOOGLE_CLIENT_ID:", clientId ? "set" : "not set")
  return clientId ? clientId : null
}

export async function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Google 로그인은 브라우저에서만 사용할 수 있어요.')
  }

  if (window.google?.accounts?.id) {
    return
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise
  }

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true' || window.google?.accounts?.id) {
        resolve()
        return
      }

      if (existingScript.dataset.loaded === 'error') {
        reject(new Error('Google 로그인 준비에 실패했어요. 잠시 후 다시 시도해주세요.'))
        return
      }

      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google 로그인 준비에 실패했어요. 잠시 후 다시 시도해주세요.')),
        {
          once: true,
        },
      )
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_IDENTITY_SCRIPT_ID
    script.src = GOOGLE_IDENTITY_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => {
      script.dataset.loaded = 'error'
      reject(new Error('Google 로그인 준비에 실패했어요. 잠시 후 다시 시도해주세요.'))
    }
    document.head.append(script)
  }).catch((error) => {
    googleIdentityScriptPromise = null
    throw error
  })

  return googleIdentityScriptPromise
}

function getGoogleIdentityApi() {
  const googleIdentityApi = window.google?.accounts?.id

  if (!googleIdentityApi) {
    throw new Error('Google 로그인 준비에 실패했어요. 잠시 후 다시 시도해주세요.')
  }

  return googleIdentityApi
}

export function renderGoogleSignInButton(options: {
  clientId: string
  container: HTMLElement
  onCredential: (response: GoogleCredentialResponse) => void
}) {
  const { clientId, container, onCredential } = options
  const googleIdentityApi = getGoogleIdentityApi()

  googleIdentityApi.initialize({
    client_id: clientId,
    callback: onCredential,
    ux_mode: 'popup',
    auto_select: false,
    use_fedcm_for_prompt: false,
  })

  const render = () => {
    const width = Math.max(240, Math.min(400, Math.floor(container.clientWidth || 320)))
    container.replaceChildren()
    googleIdentityApi.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      logo_alignment: 'left',
      width,
      locale: 'ko',
    })
  }

  render()

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          render()
        })

  resizeObserver?.observe(container)

  return () => {
    resizeObserver?.disconnect()
    container.replaceChildren()
  }
}
