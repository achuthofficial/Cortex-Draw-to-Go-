import type { DrawingSpec, DrawingTemplate } from '../types'
import { bracketDrawing } from './bracket'
import { flangeDrawing } from './flange'
import { shaftDrawing } from './shaft'

export const drawings: Record<string, DrawingSpec> = {
  [shaftDrawing.id]: shaftDrawing,
  [flangeDrawing.id]: flangeDrawing,
  [bracketDrawing.id]: bracketDrawing,
}

export const drawingByTemplate: Record<DrawingTemplate, DrawingSpec> = {
  shaft: shaftDrawing,
  flange: flangeDrawing,
  bracket: bracketDrawing,
}

export function getDrawing(id: string): DrawingSpec {
  return drawings[id] ?? shaftDrawing
}

export { shaftDrawing, flangeDrawing, bracketDrawing }
