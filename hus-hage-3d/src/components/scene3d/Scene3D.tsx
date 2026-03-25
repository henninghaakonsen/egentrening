import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useStore } from '../../store'
import WallMesh from './WallMesh'
import RoofMesh from './RoofMesh'
import OutdoorMesh from './OutdoorMesh'

export default function Scene3D() {
  const walls = useStore((s) => s.walls)
  const roof = useStore((s) => s.roof)
  const outdoorElements = useStore((s) => s.outdoorElements)
  const selectedId = useStore((s) => s.selectedId)
  const setSelected = useStore((s) => s.setSelected)
  const activeTool = useStore((s) => s.activeTool)

  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [15, 12, 15], fov: 50, near: 0.1, far: 1000 }}
      shadows
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={['#87CEEB', '#8B7355', 0.3]} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7a9e6e" roughness={0.9} />
      </mesh>

      {/* Grid overlay */}
      <Grid
        args={[100, 100]}
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#666"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444"
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Outdoor elements */}
      {outdoorElements.map((el) => (
        <OutdoorMesh
          key={el.id}
          el={el}
          selected={el.id === selectedId}
          onClick={() => activeTool === 'velg' && setSelected(el.id)}
        />
      ))}

      {/* Walls */}
      {walls.map((wall) => (
        <WallMesh
          key={`${wall.id}-${JSON.stringify(wall.openings)}-${wall.color}-${wall.height}-${wall.thickness}`}
          wall={wall}
          selected={wall.id === selectedId}
          onClick={() => activeTool === 'velg' && setSelected(wall.id)}
        />
      ))}

      {/* Roof */}
      {roof.type !== 'ingen' && walls.length > 0 && (
        <RoofMesh walls={walls} roof={roof} />
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={100}
      />
    </Canvas>
  )
}
