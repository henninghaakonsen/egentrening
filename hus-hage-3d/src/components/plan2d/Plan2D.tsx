import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useStore } from '../../store'
import type { Point, Wall, OutdoorElement } from '../../types'

// Grid size in meters per pixel at 1:1 scale
const SCALE = 40 // px per meter
const GRID = 0.5 // snap grid in meters
const SNAP_RADIUS = 12 // px

function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID
}

function svgToWorld(svgX: number, svgY: number, origin: Point): Point {
  return {
    x: snapToGrid((svgX - origin.x) / SCALE),
    y: snapToGrid((svgY - origin.y) / SCALE),
  }
}

function worldToSvg(wx: number, wy: number, origin: Point): { x: number; y: number } {
  return { x: wx * SCALE + origin.x, y: wy * SCALE + origin.y }
}

function snapToEndpoint(pt: Point, walls: Wall[], threshold = SNAP_RADIUS / SCALE): Point {
  for (const w of walls) {
    if (Math.hypot(pt.x - w.start.x, pt.y - w.start.y) < threshold)
      return { ...w.start }
    if (Math.hypot(pt.x - w.end.x, pt.y - w.end.y) < threshold)
      return { ...w.end }
  }
  return pt
}

function closestPointOnWall(pt: Point, wall: Wall): { t: number; dist: number } {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { t: 0, dist: Infinity }
  const t = Math.max(0, Math.min(1, ((pt.x - wall.start.x) * dx + (pt.y - wall.start.y) * dy) / len2))
  const cx = wall.start.x + t * dx
  const cy = wall.start.y + t * dy
  return { t, dist: Math.hypot(pt.x - cx, pt.y - cy) }
}

export default function Plan2D() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [origin, setOrigin] = useState<Point>({ x: 300, y: 300 })
  const [panStart, setPanStart] = useState<{ mouse: Point; origin: Point } | null>(null)
  const [drawStart, setDrawStart] = useState<Point | null>(null)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ mouse: Point; worldStart: Point } | null>(null)
  const [draggingOutdoor, setDraggingOutdoor] = useState<string | null>(null)

  const activeTool = useStore((s) => s.activeTool)
  const walls = useStore((s) => s.walls)
  const outdoorElements = useStore((s) => s.outdoorElements)
  const selectedId = useStore((s) => s.selectedId)
  const addWall = useStore((s) => s.addWall)
  const addOpening = useStore((s) => s.addOpening)
  const addOutdoor = useStore((s) => s.addOutdoor)
  const updateOutdoor = useStore((s) => s.updateOutdoor)
  const setSelected = useStore((s) => s.setSelected)

  const getSvgPoint = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const rect = svgRef.current!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    },
    []
  )

  const getWorldPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const sv = getSvgPoint(e)
      const raw = svgToWorld(sv.x, sv.y, origin)
      return snapToEndpoint(raw, walls)
    },
    [getSvgPoint, origin, walls]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const sv = getSvgPoint(e)

      // Pan
      if (panStart) {
        setOrigin({
          x: panStart.origin.x + sv.x - panStart.mouse.x,
          y: panStart.origin.y + sv.y - panStart.mouse.y,
        })
        return
      }

      // Drag outdoor element
      if (draggingOutdoor && dragStart) {
        const world = svgToWorld(sv.x, sv.y, origin)
        const dx = world.x - dragStart.worldStart.x
        const dy = world.y - dragStart.worldStart.y
        const el = outdoorElements.find((e) => e.id === draggingOutdoor)
        if (el) {
          const newPoints = el.points.map((p) => ({
            x: snapToGrid(p.x + dx),
            y: snapToGrid(p.y + dy),
          }))
          updateOutdoor(draggingOutdoor, { points: newPoints })
          setDragStart({ mouse: dragStart.mouse, worldStart: world })
        }
        return
      }

      setMousePos(svgToWorld(sv.x, sv.y, origin))
    },
    [getSvgPoint, panStart, draggingOutdoor, dragStart, origin, outdoorElements, updateOutdoor]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        // Middle/right click: pan
        e.preventDefault()
        setPanStart({ mouse: getSvgPoint(e), origin })
        return
      }

      if (activeTool === 'velg') return
      if (activeTool === 'tak') return

      const world = getWorldPoint(e)

      if (activeTool === 'vegg') {
        if (!drawStart) {
          setDrawStart(world)
        } else {
          // Finalize wall
          const len = Math.hypot(world.x - drawStart.x, world.y - drawStart.y)
          if (len > 0.1) {
            addWall({ start: drawStart, end: world, height: 2.4, thickness: 0.2, color: '#e8e8e8' })
          }
          setDrawStart(world) // chain walls
        }
        return
      }

      // Outdoor rect tools
      if (['terrasse', 'sti', 'hage'].includes(activeTool)) {
        setDrawStart(world)
        return
      }
    },
    [activeTool, drawStart, getWorldPoint, getSvgPoint, origin, addWall]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      setPanStart(null)

      if (draggingOutdoor) {
        setDraggingOutdoor(null)
        setDragStart(null)
        return
      }

      if (!drawStart) return

      const world = getWorldPoint(e)

      if (['terrasse', 'sti', 'hage'].includes(activeTool)) {
        const minSize = activeTool === 'sti' ? 0.3 : 0.5
        const w = Math.abs(world.x - drawStart.x)
        const h = Math.abs(world.y - drawStart.y)
        if (w > minSize || h > minSize) {
          addOutdoor({
            type: activeTool as any,
            points: [
              { x: Math.min(drawStart.x, world.x), y: Math.min(drawStart.y, world.y) },
              { x: Math.max(drawStart.x, world.x), y: Math.max(drawStart.y, world.y) },
            ],
          })
        }
        setDrawStart(null)
      }
    },
    [draggingOutdoor, drawStart, activeTool, getWorldPoint, addOutdoor]
  )

  const handleSvgClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'velg' && activeTool !== 'vindu' && activeTool !== 'dør') return

      if (activeTool === 'velg') {
        // Deselect if clicking empty space
        setSelected(null)
      }
    },
    [activeTool, setSelected]
  )

  const handleWallClick = useCallback(
    (e: React.MouseEvent, wall: Wall) => {
      e.stopPropagation()

      if (activeTool === 'velg') {
        setSelected(wall.id)
        return
      }

      if (activeTool === 'vindu' || activeTool === 'dør') {
        const sv = getSvgPoint(e)
        const world = svgToWorld(sv.x, sv.y, origin)
        const { t } = closestPointOnWall(world, wall)
        const offset = t * Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y)
        if (activeTool === 'vindu') {
          addOpening(wall.id, {
            type: 'vindu',
            offset: Math.max(0, offset - 0.5),
            width: 1.0,
            height: 1.2,
            sillHeight: 0.9,
          })
        } else {
          addOpening(wall.id, {
            type: 'dør',
            offset: Math.max(0, offset - 0.45),
            width: 0.9,
            height: 2.05,
            sillHeight: 0,
          })
        }
        setSelected(wall.id)
      }
    },
    [activeTool, getSvgPoint, origin, addOpening, setSelected]
  )

  const handleOutdoorMouseDown = useCallback(
    (e: React.MouseEvent, el: OutdoorElement) => {
      e.stopPropagation()
      if (activeTool !== 'velg') return
      setSelected(el.id)
      const sv = getSvgPoint(e)
      const world = svgToWorld(sv.x, sv.y, origin)
      setDraggingOutdoor(el.id)
      setDragStart({ mouse: sv, worldStart: world })
    },
    [activeTool, getSvgPoint, origin, setSelected]
  )

  // ESC cancels current drawing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawStart(null)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // handled by toolbar
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const cursorClass = activeTool === 'velg' ? ' mode-velg' : ''

  // Current mouse in SVG space
  const mouseSvg = worldToSvg(mousePos.x, mousePos.y, origin)
  const drawStartSvg = drawStart ? worldToSvg(drawStart.x, drawStart.y, origin) : null

  return (
    <svg
      ref={svgRef}
      className={`plan-svg${cursorClass}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleSvgClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Grid */}
      <GridLayer origin={origin} />

      {/* Outdoor elements */}
      {outdoorElements.map((el) => (
        <OutdoorSvg
          key={el.id}
          el={el}
          origin={origin}
          selected={el.id === selectedId}
          onMouseDown={(e) => handleOutdoorMouseDown(e, el)}
        />
      ))}

      {/* Walls */}
      {walls.map((wall) => (
        <WallSvg
          key={wall.id}
          wall={wall}
          origin={origin}
          selected={wall.id === selectedId}
          onClick={(e) => handleWallClick(e, wall)}
        />
      ))}

      {/* Preview: wall being drawn */}
      {activeTool === 'vegg' && drawStartSvg && (
        <line
          x1={drawStartSvg.x}
          y1={drawStartSvg.y}
          x2={mouseSvg.x}
          y2={mouseSvg.y}
          stroke="#e94560"
          strokeWidth={3}
          strokeDasharray="6 4"
          pointerEvents="none"
        />
      )}

      {/* Preview: rect tools */}
      {['terrasse', 'sti', 'hage'].includes(activeTool) && drawStartSvg && (
        <OutdoorPreviewRect
          start={drawStart!}
          end={mousePos}
          origin={origin}
          type={activeTool as any}
        />
      )}

      {/* Snapping dot */}
      {(activeTool === 'vegg') && (
        <circle cx={mouseSvg.x} cy={mouseSvg.y} r={4} fill="#e94560" pointerEvents="none" />
      )}

      {/* Scale legend */}
      <ScaleLegend origin={origin} />
    </svg>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function GridLayer({ origin }: { origin: Point }) {
  const gridPx = GRID * SCALE
  const majorPx = 1 * SCALE // 1m = major line
  return (
    <g pointerEvents="none">
      <defs>
        <pattern id="minor-grid" width={gridPx} height={gridPx} patternUnits="userSpaceOnUse"
          x={origin.x % gridPx} y={origin.y % gridPx}>
          <path d={`M ${gridPx} 0 L 0 0 0 ${gridPx}`} fill="none" stroke="#d0cfc8" strokeWidth={0.5} />
        </pattern>
        <pattern id="major-grid" width={majorPx} height={majorPx} patternUnits="userSpaceOnUse"
          x={origin.x % majorPx} y={origin.y % majorPx}>
          <path d={`M ${majorPx} 0 L 0 0 0 ${majorPx}`} fill="none" stroke="#b0afa8" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f5f5f0" />
      <rect width="100%" height="100%" fill="url(#minor-grid)" />
      <rect width="100%" height="100%" fill="url(#major-grid)" />
    </g>
  )
}

function WallSvg({
  wall,
  origin,
  selected,
  onClick,
}: {
  wall: Wall
  origin: Point
  selected: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const s = worldToSvg(wall.start.x, wall.start.y, origin)
  const e2 = worldToSvg(wall.end.x, wall.end.y, origin)
  const thickness = wall.thickness * SCALE

  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len = Math.hypot(dx, dy)
  if (len < 0.01) return null
  const nx = -dy / len
  const ny = dx / len

  const half = thickness / 2
  const p1 = { x: s.x + nx * half, y: s.y + ny * half }
  const p2 = { x: s.x - nx * half, y: s.y - ny * half }
  const p3 = { x: e2.x - nx * half, y: e2.y - ny * half }
  const p4 = { x: e2.x + nx * half, y: e2.y + ny * half }
  const pts = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`

  // Render openings on wall
  const wallLen = len

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <polygon
        points={pts}
        fill={wall.color}
        stroke={selected ? '#e94560' : '#555'}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Openings */}
      {wall.openings.map((op) => {
        const t0 = op.offset / wallLen
        const t1 = (op.offset + op.width) / wallLen
        const os = worldToSvg(
          wall.start.x + t0 * dx,
          wall.start.y + t0 * dy,
          origin
        )
        const oe = worldToSvg(
          wall.start.x + t1 * dx,
          wall.start.y + t1 * dy,
          origin
        )
        const midX = (os.x + oe.x) / 2
        const midY = (os.y + oe.y) / 2
        const pw = op.width * SCALE
        return (
          <g key={op.id} pointerEvents="none">
            {/* White gap to show opening */}
            <line
              x1={os.x}
              y1={os.y}
              x2={oe.x}
              y2={oe.y}
              stroke={op.type === 'vindu' ? '#88ccff' : '#ffcc88'}
              strokeWidth={thickness}
            />
            {op.type === 'dør' && (
              // Door swing arc
              <path
                d={`M ${oe.x} ${oe.y} A ${pw} ${pw} 0 0 1 ${oe.x - (oe.x - os.x) * 0.3 + nx * pw * 0.7} ${oe.y - (oe.y - os.y) * 0.3 + ny * pw * 0.7}`}
                fill="none"
                stroke="#ffaa44"
                strokeWidth={1}
              />
            )}
          </g>
        )
      })}
      {/* Endpoint dots */}
      <circle cx={s.x} cy={s.y} r={4} fill={selected ? '#e94560' : '#333'} pointerEvents="none" />
      <circle cx={e2.x} cy={e2.y} r={4} fill={selected ? '#e94560' : '#333'} pointerEvents="none" />
    </g>
  )
}

function OutdoorSvg({
  el,
  origin,
  selected,
  onMouseDown,
}: {
  el: OutdoorElement
  origin: Point
  selected: boolean
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const defaultColors: Record<string, string> = {
    terrasse: '#c8a96e',
    sti: '#aaaaaa',
    hage: '#7ec87e',
    gjerde: '#8b6914',
  }
  const color = el.color ?? defaultColors[el.type]

  if (el.points.length < 2) return null

  const p0 = worldToSvg(el.points[0].x, el.points[0].y, origin)
  const p1 = worldToSvg(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y, origin)
  const x = Math.min(p0.x, p1.x)
  const y = Math.min(p0.y, p1.y)
  const w = Math.abs(p1.x - p0.x)
  const h = Math.abs(p1.y - p0.y)

  const typeLabels: Record<string, string> = {
    terrasse: 'Terrasse',
    sti: 'Sti',
    hage: 'Hage',
    gjerde: 'Gjerde',
  }

  return (
    <g onMouseDown={onMouseDown} style={{ cursor: 'move' }}>
      <rect
        x={x} y={y} width={w} height={h}
        fill={color}
        fillOpacity={0.5}
        stroke={selected ? '#e94560' : color}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={el.type === 'gjerde' ? '4 3' : 'none'}
      />
      {w > 30 && h > 16 && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 4}
          textAnchor="middle"
          fontSize={11}
          fill="#333"
          pointerEvents="none"
        >
          {typeLabels[el.type]}
        </text>
      )}
    </g>
  )
}

function OutdoorPreviewRect({
  start,
  end,
  origin,
  type,
}: {
  start: Point
  end: Point
  origin: Point
  type: 'terrasse' | 'sti' | 'hage' | 'gjerde'
}) {
  const colors: Record<string, string> = {
    terrasse: '#c8a96e',
    sti: '#aaaaaa',
    hage: '#7ec87e',
    gjerde: '#8b6914',
  }
  const p0 = worldToSvg(start.x, start.y, origin)
  const p1 = worldToSvg(end.x, end.y, origin)
  const x = Math.min(p0.x, p1.x)
  const y = Math.min(p0.y, p1.y)
  const w = Math.abs(p1.x - p0.x)
  const h = Math.abs(p1.y - p0.y)

  return (
    <rect
      x={x} y={y} width={w} height={h}
      fill={colors[type]}
      fillOpacity={0.3}
      stroke={colors[type]}
      strokeWidth={1.5}
      strokeDasharray="5 3"
      pointerEvents="none"
    />
  )
}

function ScaleLegend({ origin }: { origin: Point }) {
  const meterPx = SCALE
  const x = 16
  const y = 24
  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={x + meterPx} y2={y} stroke="#888" strokeWidth={2} />
      <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#888" strokeWidth={1.5} />
      <line x1={x + meterPx} y1={y - 4} x2={x + meterPx} y2={y + 4} stroke="#888" strokeWidth={1.5} />
      <text x={x + meterPx / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#666">1 m</text>
    </g>
  )
}
