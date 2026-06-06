import { createNoise2D, type NoiseFunction2D } from 'simplex-noise'

export type Noise2D = NoiseFunction2D

export function makeNoise2D(seed?: () => number): Noise2D {
  return createNoise2D(seed)
}
