import React from 'react'
import { useStore } from '../store'
import type { ToolType, ViewMode } from '../types'

interface ToolDef {
  id: ToolType
  icon: string
  label: string
}

const TOOLS: ToolDef[] = [
  { id: 'velg', icon: '↖', label: 'Velg' },
  { id: 'vegg', icon: '▬', label: 'Vegg' },
  { id: 'vindu', icon: '⬜', label: 'Vindu' },
  { id: 'dør', icon: '🚪', label: 'Dør' },
  { id: 'tak', icon: '⌂', label: 'Tak' },
  { id: 'terrasse', icon: '▦', label: 'Terrasse' },
  { id: 'sti', icon: '—', label: 'Sti' },
  { id: 'hage', icon: '🌿', label: 'Hage' },
  { id: 'gjerde', icon: '⊞', label: 'Gjerde' },
]

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: '2d', label: '2D' },
  { id: 'split', label: 'Split' },
  { id: '3d', label: '3D' },
]

export default function Toolbar() {
  const activeTool = useStore((s) => s.activeTool)
  const viewMode = useStore((s) => s.viewMode)
  const selectedId = useStore((s) => s.selectedId)
  const walls = useStore((s) => s.walls)
  const outdoorElements = useStore((s) => s.outdoorElements)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const setViewMode = useStore((s) => s.setViewMode)
  const deleteWall = useStore((s) => s.deleteWall)
  const deleteOutdoor = useStore((s) => s.deleteOutdoor)
  const setSelected = useStore((s) => s.setSelected)

  const handleDelete = () => {
    if (!selectedId) return
    if (walls.some((w) => w.id === selectedId)) deleteWall(selectedId)
    else if (outdoorElements.some((e) => e.id === selectedId)) deleteOutdoor(selectedId)
    setSelected(null)
  }

  return (
    <div className="topbar">
      <h1>Hus & Hage 3D</h1>

      <div className="tool-group">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tool-btn${activeTool === t.id ? ' active' : ''}`}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
          >
            <span className="icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="tool-divider" />

      <div className="tool-group">
        {VIEW_MODES.map((v) => (
          <button
            key={v.id}
            className={`view-btn${viewMode === v.id ? ' active' : ''}`}
            onClick={() => setViewMode(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {selectedId && (
        <button className="delete-btn" onClick={handleDelete}>
          🗑 Slett
        </button>
      )}
    </div>
  )
}
