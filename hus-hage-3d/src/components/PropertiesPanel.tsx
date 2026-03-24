import React from 'react'
import { useStore } from '../store'
import type { Wall, OutdoorElement, Opening } from '../types'

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedId)
  const walls = useStore((s) => s.walls)
  const outdoorElements = useStore((s) => s.outdoorElements)
  const roof = useStore((s) => s.roof)
  const activeTool = useStore((s) => s.activeTool)

  const selectedWall = walls.find((w) => w.id === selectedId)
  const selectedOutdoor = outdoorElements.find((e) => e.id === selectedId)

  return (
    <div className="props-panel">
      {activeTool === 'tak' && <RoofProps />}
      {selectedWall && <WallProps wall={selectedWall} />}
      {selectedOutdoor && <OutdoorProps el={selectedOutdoor} />}
      {!selectedWall && !selectedOutdoor && activeTool !== 'tak' && (
        <p className="no-selection">
          Velg et element i tegningen for å redigere egenskaper
        </p>
      )}
    </div>
  )
}

function RoofProps() {
  const roof = useStore((s) => s.roof)
  const updateRoof = useStore((s) => s.updateRoof)

  return (
    <>
      <h3>Tak</h3>
      <div className="prop-row">
        <label>Type</label>
        <select
          value={roof.type}
          onChange={(e) => updateRoof({ type: e.target.value as any })}
        >
          <option value="ingen">Ingen</option>
          <option value="flatt">Flatt tak</option>
          <option value="saltak">Saltak</option>
        </select>
      </div>
      {roof.type === 'saltak' && (
        <div className="prop-row">
          <label>Helning (grader)</label>
          <input
            type="number"
            min={10}
            max={60}
            value={roof.pitch}
            onChange={(e) => updateRoof({ pitch: +e.target.value })}
          />
        </div>
      )}
      <div className="prop-row">
        <label>Utstikk (m)</label>
        <input
          type="number"
          min={0}
          max={1.5}
          step={0.1}
          value={roof.overhang}
          onChange={(e) => updateRoof({ overhang: +e.target.value })}
        />
      </div>
      <div className="prop-row">
        <label>Farge</label>
        <input
          type="color"
          value={roof.color}
          onChange={(e) => updateRoof({ color: e.target.value })}
        />
      </div>
    </>
  )
}

function WallProps({ wall }: { wall: Wall }) {
  const updateWall = useStore((s) => s.updateWall)
  const addOpening = useStore((s) => s.addOpening)
  const updateOpening = useStore((s) => s.updateOpening)
  const deleteOpening = useStore((s) => s.deleteOpening)

  const wallLength = Math.hypot(
    wall.end.x - wall.start.x,
    wall.end.y - wall.start.y
  )

  return (
    <>
      <h3>Vegg</h3>
      <div className="prop-row">
        <label>Lengde</label>
        <input type="text" readOnly value={`${wallLength.toFixed(2)} m`} />
      </div>
      <div className="prop-row">
        <label>Høyde (m)</label>
        <input
          type="number"
          min={1.8}
          max={5}
          step={0.1}
          value={wall.height}
          onChange={(e) => updateWall(wall.id, { height: +e.target.value })}
        />
      </div>
      <div className="prop-row">
        <label>Tykkelse (m)</label>
        <input
          type="number"
          min={0.1}
          max={0.5}
          step={0.05}
          value={wall.thickness}
          onChange={(e) => updateWall(wall.id, { thickness: +e.target.value })}
        />
      </div>
      <div className="prop-row">
        <label>Farge</label>
        <input
          type="color"
          value={wall.color}
          onChange={(e) => updateWall(wall.id, { color: e.target.value })}
        />
      </div>

      <div className="prop-section">
        <h4>Åpninger</h4>
        {wall.openings.map((o) => (
          <OpeningItem
            key={o.id}
            opening={o}
            wallLength={wallLength}
            onUpdate={(updates) => updateOpening(wall.id, o.id, updates)}
            onDelete={() => deleteOpening(wall.id, o.id)}
          />
        ))}
        <button
          className="add-btn"
          onClick={() =>
            addOpening(wall.id, {
              type: 'vindu',
              offset: wallLength / 2 - 0.5,
              width: 1.0,
              height: 1.2,
              sillHeight: 0.9,
            })
          }
        >
          + Legg til vindu
        </button>
        <button
          className="add-btn"
          style={{ marginTop: 4 }}
          onClick={() =>
            addOpening(wall.id, {
              type: 'dør',
              offset: wallLength / 2 - 0.45,
              width: 0.9,
              height: 2.05,
              sillHeight: 0,
            })
          }
        >
          + Legg til dør
        </button>
      </div>
    </>
  )
}

function OpeningItem({
  opening,
  wallLength,
  onUpdate,
  onDelete,
}: {
  opening: Opening
  wallLength: number
  onUpdate: (u: Partial<Opening>) => void
  onDelete: () => void
}) {
  return (
    <div className="opening-item">
      <div className="opening-item-header">
        <span>{opening.type === 'vindu' ? '⬜ Vindu' : '🚪 Dør'}</span>
        <button className="opening-delete-btn" onClick={onDelete}>
          ✕
        </button>
      </div>
      <div className="prop-row">
        <label>Bredde (m)</label>
        <input
          type="number"
          min={0.3}
          max={3}
          step={0.1}
          value={opening.width}
          onChange={(e) => onUpdate({ width: +e.target.value })}
        />
      </div>
      <div className="prop-row">
        <label>Høyde (m)</label>
        <input
          type="number"
          min={0.3}
          max={3}
          step={0.1}
          value={opening.height}
          onChange={(e) => onUpdate({ height: +e.target.value })}
        />
      </div>
      {opening.type === 'vindu' && (
        <div className="prop-row">
          <label>Høyde fra gulv (m)</label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.05}
            value={opening.sillHeight}
            onChange={(e) => onUpdate({ sillHeight: +e.target.value })}
          />
        </div>
      )}
      <div className="prop-row">
        <label>Posisjon langs vegg (m)</label>
        <input
          type="number"
          min={0}
          max={wallLength}
          step={0.1}
          value={opening.offset}
          onChange={(e) => onUpdate({ offset: +e.target.value })}
        />
      </div>
    </div>
  )
}

function OutdoorProps({ el }: { el: OutdoorElement }) {
  const updateOutdoor = useStore((s) => s.updateOutdoor)

  const typeLabels: Record<string, string> = {
    terrasse: 'Terrasse',
    sti: 'Sti',
    hage: 'Hageområde',
    gjerde: 'Gjerde',
  }

  const defaultColors: Record<string, string> = {
    terrasse: '#c8a96e',
    sti: '#aaaaaa',
    hage: '#4a7c59',
    gjerde: '#8b6914',
  }

  const color = el.color ?? defaultColors[el.type]

  return (
    <>
      <h3>{typeLabels[el.type]}</h3>
      <div className="prop-row">
        <label>Farge</label>
        <input
          type="color"
          value={color}
          onChange={(e) => updateOutdoor(el.id, { color: e.target.value })}
        />
      </div>
    </>
  )
}
