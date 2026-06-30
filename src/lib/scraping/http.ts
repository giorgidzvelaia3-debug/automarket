// Polite HTTP fetching for scrapers: descriptive UA, timeout, one retry on
// transient errors, and a configurable inter-request delay to avoid hammering
// source sites.

const USER_AGENT =
  "Mozilla/5.0 (compatible; AutoMarketBot/1.0; price comparison; +https://automarket.ge)"

const DEFAULT_TIMEOUT_MS = 15_000

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** A random polite delay between requests (jittered to look less robotic). */
export function politeDelay(): Promise<void> {
  const ms = 800 + Math.floor(Math.random() * 700) // 800–1500ms
  return delay(ms)
}

export async function fetchHtml(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1 }: { timeoutMs?: number; retries?: number } = {}
): Promise<string> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ka,en;q=0.8",
        },
      })

      // Retry on rate-limit / server errors.
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status} for ${url}`)
        if (attempt < retries) {
          await delay(2000 * (attempt + 1))
          continue
        }
        throw lastError
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`)
      }

      return await res.text()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await delay(2000 * (attempt + 1))
        continue
      }
      throw lastError
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`)
}

export async function fetchJson<T = unknown>(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1 }: { timeoutMs?: number; retries?: number } = {}
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Accept-Language": "ka,en;q=0.8",
        },
      })
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status} for ${url}`)
        if (attempt < retries) {
          await delay(2000 * (attempt + 1))
          continue
        }
        throw lastError
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return (await res.json()) as T
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await delay(2000 * (attempt + 1))
        continue
      }
      throw lastError
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`)
}
