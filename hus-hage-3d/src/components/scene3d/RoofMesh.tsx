import React, { useMemo } from 'react'
import * as THREE from 'three'
import type { Wall, Roof } from '../../types'

interface Props {
  walls: Wall[]
  roof: Roof
}

export default function RoofMesh({ walls, roof }: Props) {
  const { geometry, position } = useMemo(() => {
    if (walls.length === 0) return { geometry: null, position: [0, 0, 0] as [number, number, number] }

    // Compute bounding box of all wall endpoints
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    let maxWallH = 0
    for (const w of walls) {
      minX = Math.min(minX, w.start.x, w.end.x)
      maxX = Math.max(maxX, w.start.x, w.end.x)
      minZ = Math.min(minZ, w.start.y, w.end.y)
      maxZ = Math.max(maxZ, w.start.y, w.end.y)
      maxWallH = Math.max(maxWallH, w.height)
    }

    const ov = roof.overhang
    const footX = maxX - minX + ov * 2
    const footZ = maxZ - minZ + ov * 2
    const cx = (minX + maxX) / 2
    const cz = (minZ + maxZ) / 2

    if (roof.type === 'flatt') {
      const thickness = 0.2
      const geo = new THREE.BoxGeometry(footX, thickness, footZ)
      return {
        geometry: geo,
        position: [cx, maxWallH + thickness / 2, cz] as [number, number, number],
      }
    }

    // Saltak (gable roof)
    const pitchRad = (roof.pitch * Math.PI) / 180
    const ridgeH = (footX / 2) * Math.tan(pitchRad) // height of ridge above wall top

    // Build gable roof from scratch using BufferGeometry
    // Ridge along Z axis at center
    const ridgeY = maxWallH + ridgeH

    // Vertices:
    // left edge bottom-front, right edge bottom-front, ridge-front
    // left edge bottom-back, right edge bottom-back, ridge-back
    const hx = footX / 2
    const hz = footZ / 2
    const baseY = maxWallH

    const vertices = new Float32Array([
      // Front face (z = -hz)
      -hx, baseY, -hz, // 0: left-front-bottom
       hx, baseY, -hz, // 1: right-front-bottom
        0, ridgeY, -hz, // 2: ridge-front

      // Back face (z = +hz)
      -hx, baseY, hz, // 3: left-back-bottom
       hx, baseY, hz, // 4: right-back-bottom
        0, ridgeY, hz, // 5: ridge-back

      // Left slope
      -hx, baseY, -hz, // 6 = 0
      -hx, baseY,  hz, // 7 = 3
        0, ridgeY, -hz, // 8 = 2
        0, ridgeY,  hz, // 9 = 5

      // Right slope
       hx, baseY, -hz, // 10 = 1
       hx, baseY,  hz, // 11 = 4
        0, ridgeY, -hz, // 12 = 2
        0, ridgeY,  hz, // 13 = 5
    ])

    const indices = [
      // Front triangle
      0, 2, 1,
      // Back triangle
      3, 4, 5,
      // Left slope (2 triangles)
      6, 8, 7,
      8, 9, 7,
      // Right slope (2 triangles)
      10, 11, 12,
      12, 11, 13,
    ]

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return {
      geometry: geo,
      position: [cx, 0, cz] as [number, number, number],
    }
  }, [walls, roof])

  if (!geometry) return null

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={roof.color} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}
