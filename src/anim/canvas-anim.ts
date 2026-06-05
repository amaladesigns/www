import { makeNoise2D, type Noise2D } from './noise'

type Config = {
  rings: number
  samples: number
  baseRadius: number
  amplitude: number
  hueSpeed: number
  noiseSpeed: number
  noiseScale: number
  lineWidth: number
  alpha: number
}

const DEFAULTS: Config = {
  rings: 18,
  samples: 220,
  baseRadius: 0.36,
  amplitude: 0.045,
  hueSpeed: 12,
  noiseSpeed: 0.18,
  noiseScale: 1.6,
  lineWidth: 1.4,
  alpha: 0.55,
}

export type CanvasAnim = {
  start: () => void
  stop: () => void
  dispose: () => void
}

export function mountCanvasAnim(
  canvas: HTMLCanvasElement,
  options: Partial<Config> = {},
): CanvasAnim {
  const cfg: Config = { ...DEFAULTS, ...options }
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) throw new Error('2D context unavailable')

  const noise: Noise2D = makeNoise2D()

  let width = 0
  let height = 0
  let dpr = 1
  let rafId: number | null = null
  let startMs = performance.now()
  let pausedAt: number | null = null

  function resize(): void {
    const rect = canvas.getBoundingClientRect()
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = Math.max(1, Math.floor(rect.width))
    height = Math.max(1, Math.floor(rect.height))
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function frame(now: number): void {
    const t = (now - startMs) / 1000
    const cx = width / 2
    const cy = height / 2
    const R = Math.min(width, height) * cfg.baseRadius
    const amp = Math.min(width, height) * cfg.amplitude

    ctx!.clearRect(0, 0, width, height)
    ctx!.globalCompositeOperation = 'lighter'
    ctx!.lineWidth = cfg.lineWidth

    for (let i = 0; i < cfg.rings; i++) {
      const ringT = i / cfg.rings
      const ringR = R * (0.55 + ringT * 0.9)
      const hueBase = (ringT * 360 + t * cfg.hueSpeed) % 360
      ctx!.strokeStyle = `hsla(${hueBase}, 90%, 60%, ${cfg.alpha})`
      ctx!.beginPath()
      for (let s = 0; s <= cfg.samples; s++) {
        const a = (s / cfg.samples) * Math.PI * 2
        const nx = Math.cos(a) * cfg.noiseScale + ringT * 1.3
        const ny = Math.sin(a) * cfg.noiseScale + t * cfg.noiseSpeed
        const n = noise(nx, ny)
        const r = ringR + n * amp * (0.6 + ringT * 0.8)
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (s === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.stroke()
    }
    ctx!.globalCompositeOperation = 'source-over'

    rafId = requestAnimationFrame(frame)
  }

  function onResize(): void {
    resize()
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      if (pausedAt !== null) {
        startMs += performance.now() - pausedAt
        pausedAt = null
      }
      if (rafId === null) rafId = requestAnimationFrame(frame)
    } else {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
        pausedAt = performance.now()
      }
    }
  }

  function start(): void {
    resize()
    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    startMs = performance.now()
    rafId = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  function dispose(): void {
    stop()
    ctx!.clearRect(0, 0, width, height)
  }

  return { start, stop, dispose }
}

export function drawStaticFallback(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.max(1, Math.floor(rect.width))
  const h = Math.max(1, Math.floor(rect.height))
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.36
  ctx.lineWidth = 1.4
  ctx.strokeStyle = 'hsla(200, 60%, 60%, 0.6)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}
