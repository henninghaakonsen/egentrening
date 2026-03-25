import React from 'react'
import { useStore } from './store'
import Toolbar from './components/Toolbar'
import PropertiesPanel from './components/PropertiesPanel'
import Plan2D from './components/plan2d/Plan2D'
import Scene3D from './components/scene3d/Scene3D'

export default function App() {
  const viewMode = useStore((s) => s.viewMode)

  return (
    <div className="app">
      <Toolbar />
      <div className="main-content">
        {(viewMode === '2d' || viewMode === 'split') && (
          <div className={`plan-container${viewMode === '2d' ? ' full' : ''}`}>
            <div className="plan-label">2D Plantegning</div>
            <Plan2D />
          </div>
        )}
        {(viewMode === '3d' || viewMode === 'split') && (
          <div className={`scene-container${viewMode === '3d' ? ' full' : ''}`}>
            <div className="scene-label">3D Visning</div>
            <Scene3D />
          </div>
        )}
        <PropertiesPanel />
      </div>
      <HintBar />
    </div>
  )
}

function HintBar() {
  const activeTool = useStore((s) => s.activeTool)
  const hints: Record<string, string> = {
    velg: 'Klikk på et element for å velge det',
    vegg: 'Klikk for å starte vegg · Klikk igjen for å avslutte',
    vindu: 'Klikk på en vegg for å plassere vindu',
    dør: 'Klikk på en vegg for å plassere dør',
    tak: 'Juster tak-innstillinger i egenskapspanelet',
    terrasse: 'Klikk og dra for å tegne terrasse',
    sti: 'Klikk og dra for å tegne sti',
    hage: 'Klikk og dra for å tegne hageområde',
    gjerde: 'Klikk for å legge til punkter · Dobbeltklikk for å avslutte',
  }
  return <div className="hint-bar">{hints[activeTool] ?? ''}</div>
}
