import { makeNoise2D, type Noise2D } from './noise'

type Config = {
  rings: number
  samples: number
  baseRadius: number
  radiusSpread: number
  ellipseRatio: number
  amplitude: number
  envelopePeriod: number
  envelopeFloor: number
  hueSpeed: number
  noiseSpeed: number
  noiseScale: number
  ringRotationSpeed: number
  lineWidth: number
  alpha: number
  centerOffsetY: number
}

const DEFAULTS: Config = {
  rings: 28,
  samples: 260,
  baseRadius: 0.27,
  radiusSpread: 0.13,
  ellipseRatio: 0.94,
  amplitude: 0.022,
  envelopePeriod: 11,
  envelopeFloor: 0.06,
  hueSpeed: 0.06,
  noiseSpeed: 0.22,
  noiseScale: 1.2,
  ringRotationSpeed: 0.012,
  lineWidth: 1.6,
  alpha: 0.82,
  centerOffsetY: 0.36,
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

  // 各リングの固定パラメータ。中心オフセットに右上バイアスを与えて
  // 元ロゴの「左下が疎・右上が密に厚みが出る」重なりを再現する
  const ringSeeds = Array.from({ length: cfg.rings }, (_, i) => {
    const ringT = i / Math.max(1, cfg.rings - 1)
    return {
      rotation: (i / cfg.rings) * Math.PI * 2,
      radiusFactor: 1 + ringT * cfg.radiusSpread,
      alphaFactor: 1 - Math.pow(ringT, 1.3) * 0.5,
      centerDx: noise(i * 0.13, 1.7) * 0.005 + 0.012,
      centerDy: noise(i * 0.17, 4.2) * 0.005 - 0.014,
      noiseY: i * 0.83,
      noiseScale: cfg.noiseScale * (0.85 + ringT * 0.4),
    }
  })

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
    const cy = height * cfg.centerOffsetY
    const minDim = Math.min(width, height)
    const R = minDim * cfg.baseRadius
    const ampBase = minDim * cfg.amplitude

    // envelope: 0 (ロゴ本来の形に収束) ↔ 1 (最大揺らぎ) を周期的にループ
    const phase = (t / cfg.envelopePeriod) % 1
    const rawEnv = (1 - Math.cos(phase * Math.PI * 2)) / 2
    const envelope = Math.pow(rawEnv, 1.4)
    const ampNow = ampBase * (cfg.envelopeFloor + (1 - cfg.envelopeFloor) * envelope)

    ctx!.clearRect(0, 0, width, height)
    ctx!.globalCompositeOperation = 'source-over'
    ctx!.lineWidth = cfg.lineWidth
    ctx!.lineCap = 'round'

    // 全リング共通の conic グラデーション。元ロゴの色相分布に合わせる:
    // 12時=緑、3時=青〜紫、6時=赤、9時=黄〜オレンジ
    const hueOffset = t * cfg.hueSpeed
    const baseGrad = ctx!.createConicGradient(-Math.PI / 2 + hueOffset, cx, cy)
    const HUE_STOPS = 12
    const HUE_BASE = 120 // 12時を緑から始める
    for (let h = 0; h <= HUE_STOPS; h++) {
      const hue = (HUE_BASE + (h / HUE_STOPS) * 360) % 360
      baseGrad.addColorStop(h / HUE_STOPS, `hsl(${hue}, 86%, 52%)`)
    }

    for (let i = 0; i < cfg.rings; i++) {
      const seed = ringSeeds[i]
      const rotation = seed.rotation + t * cfg.ringRotationSpeed
      const r0 = R * seed.radiusFactor
      const offX = cx + minDim * seed.centerDx
      const offY = cy + minDim * seed.centerDy

      ctx!.globalAlpha = cfg.alpha * seed.alphaFactor
      ctx!.strokeStyle = baseGrad
      ctx!.beginPath()
      for (let s = 0; s <= cfg.samples; s++) {
        const a = (s / cfg.samples) * Math.PI * 2
        const cosA = Math.cos(a)
        const sinA = Math.sin(a)
        const n = noise(
          cosA * seed.noiseScale + seed.noiseY,
          sinA * seed.noiseScale + t * cfg.noiseSpeed,
        )
        const r = r0 + n * ampNow
        // 楕円: y 方向を ellipseRatio で潰し、リングごとに回転
        const ex = cosA * r
        const ey = sinA * r * cfg.ellipseRatio
        const x = offX + ex * Math.cos(rotation) - ey * Math.sin(rotation)
        const y = offY + ex * Math.sin(rotation) + ey * Math.cos(rotation)
        if (s === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.stroke()
    }
    ctx!.globalAlpha = 1

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
  const R = Math.min(w, h) * 0.36
  const N = 12
  ctx.lineWidth = 1.1
  for (let i = 0; i < N; i++) {
    const p = i / N
    const hue = p * 360
    const rot = p * Math.PI * 2
    ctx.strokeStyle = `hsla(${hue}, 80%, 55%, 0.7)`
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, R, R * 0.94, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
