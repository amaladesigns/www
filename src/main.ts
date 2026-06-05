import './style.css'
import { drawStaticFallback, mountCanvasAnim } from './anim/canvas-anim'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isLegacy(): boolean {
  return new URLSearchParams(window.location.search).has('legacy')
}

function init(): void {
  const figure = document.querySelector<HTMLElement>('.logo')
  const canvas = document.querySelector<HTMLCanvasElement>('.logo__canvas')
  if (!figure || !canvas) return

  if (isLegacy()) {
    figure.dataset.mode = 'legacy'
    return
  }

  if (prefersReducedMotion()) {
    figure.dataset.mode = 'static'
    drawStaticFallback(canvas)
    return
  }

  try {
    const anim = mountCanvasAnim(canvas)
    figure.dataset.mode = 'canvas'
    anim.start()
  } catch {
    figure.dataset.mode = 'legacy'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
