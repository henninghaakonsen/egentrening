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
    // Ridge runs along the LONGER horizontal axis so the roof looks correct.
    // For a house wider in X than Z: ridge along X, slopes in ±Z direction.
    const pitchRad = (roof.pitch * Math.PI) / 180
    const hx = footX / 2
    const hz = footZ / 2
    const baseY = maxWallH

    let ridgeH: number
    let vertices: Float32Array
    if (footX >= footZ) {
      // Ridge along X, slopes in ±Z
      ridgeH = hz * Math.tan(pitchRad)
      const ridgeY = baseY + ridgeH
      vertices = new Float32Array([
        // Front slope base (z = -hz): 0,1
        -hx, baseY, -hz,
         hx, baseY, -hz,
        // Back slope base (z = +hz): 2,3
        -hx, baseY,  hz,
         hx, baseY,  hz,
        // Ridge (z = 0): 4,5
        -hx, ridgeY, 0,
         hx, ridgeY, 0,
      ])
    } else {
      // Ridge along Z, slopes in ±X
      ridgeH = hx * Math.tan(pitchRad)
      const ridgeY = baseY + ridgeH
      vertices = new Float32Array([
        // Left slope base (x = -hx): 0,1
        -hx, baseY, -hz,
        -hx, baseY,  hz,
        // Right slope base (x = +hx): 2,3
         hx, baseY, -hz,
         hx, baseY,  hz,
        // Ridge (x = 0): 4,5
         0, ridgeY, -hz,
         0, ridgeY,  hz,
      ])
    }

    const indices = [
      // Front slope: 0,1,4 + 1,5,4
      0, 1, 4,  1, 5, 4,
      // Back slope:  2,3,5 + 2,5,4 ... wait, reversed
      3, 2, 5,  2, 4, 5,
      // Left gable: 0,2,4
      2, 0, 4,
      // Right gable: 1,3,5
      1, 3, 5,
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
