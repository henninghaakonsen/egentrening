import React from 'react'
import type { OutdoorElement } from '../../types'

interface Props {
  el: OutdoorElement
  selected: boolean
  onClick: () => void
}

const DEFAULT_COLORS: Record<string, string> = {
  terrasse: '#c8a96e',
  sti: '#aaaaaa',
  hage: '#4a7c59',
  gjerde: '#8b6914',
}

const HEIGHTS: Record<string, number> = {
  terrasse: 0.25,
  sti: 0.05,
  hage: 0.1,
  gjerde: 1.2,
}

export default function OutdoorMesh({ el, selected, onClick }: Props) {
  if (el.points.length < 2) return null

  const p0 = el.points[0]
  const p1 = el.points[el.points.length - 1]

  const width = Math.abs(p1.x - p0.x)
  const depth = Math.abs(p1.y - p0.y)

  if (width < 0.05 && depth < 0.05) return null

  const cx = (p0.x + p1.x) / 2
  const cz = (p0.y + p1.y) / 2

  const color = el.color ?? DEFAULT_COLORS[el.type]
  const h = HEIGHTS[el.type]

  if (el.type === 'gjerde') {
    // Fence: render as thin tall box along the rectangle perimeter
    return <FenceMesh p0={p0} p1={p1} color={color} selected={selected} onClick={onClick} />
  }

  return (
    <mesh
      position={[cx, h / 2, cz]}
      castShadow
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <boxGeometry args={[Math.max(width, 0.1), h, Math.max(depth, 0.1)]} />
      <meshStandardMaterial
        color={selected ? '#ff9090' : color}
        roughness={el.type === 'terrasse' ? 0.7 : 0.9}
      />
    </mesh>
  )
}

function FenceMesh({
  p0,
  p1,
  color,
  selected,
  onClick,
}: {
  p0: { x: number; y: number }
  p1: { x: number; y: number }
  color: string
  selected: boolean
  onClick: () => void
}) {
  const h = HEIGHTS.gjerde
  const t = 0.08 // fence thickness
  const w = Math.abs(p1.x - p0.x)
  const d = Math.abs(p1.y - p0.y)
  const minX = Math.min(p0.x, p1.x)
  const minZ = Math.min(p0.y, p1.y)

  const segments = [
    // Bottom
    { pos: [minX + w / 2, h / 2, minZ] as [number, number, number], size: [w, h, t] as [number, number, number] },
    // Top
    { pos: [minX + w / 2, h / 2, minZ + d] as [number, number, number], size: [w, h, t] as [number, number, number] },
    // Left
    { pos: [minX, h / 2, minZ + d / 2] as [number, number, number], size: [t, h, d] as [number, number, number] },
    // Right
    { pos: [minX + w, h / 2, minZ + d / 2] as [number, number, number], size: [t, h, d] as [number, number, number] },
  ]

  const mat = <meshStandardMaterial color={selected ? '#ff9090' : color} roughness={0.8} />

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick() }}>
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.pos} castShadow>
          <boxGeometry args={seg.size} />
          {mat}
        </mesh>
      ))}
    </group>
  )
}
