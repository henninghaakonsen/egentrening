import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SceneState, Wall, Opening, OutdoorElement, Roof } from './types';

// Demo house: 10×8m Norwegian house with windows, door, terrace, garden and fence
const DEMO_WALLS: Wall[] = [
  // Front wall (south) — has door + 2 windows
  {
    id: 'w1', start: { x: 0, y: 0 }, end: { x: 10, y: 0 },
    height: 2.6, thickness: 0.25, color: '#f0ece4',
    openings: [
      { id: 'o1', type: 'dør', offset: 4.55, width: 0.9, height: 2.1, sillHeight: 0 },
      { id: 'o2', type: 'vindu', offset: 1.0, width: 1.4, height: 1.2, sillHeight: 0.9 },
      { id: 'o3', type: 'vindu', offset: 7.6, width: 1.4, height: 1.2, sillHeight: 0.9 },
    ],
  },
  // Back wall (north) — 2 windows
  {
    id: 'w2', start: { x: 10, y: 8 }, end: { x: 0, y: 8 },
    height: 2.6, thickness: 0.25, color: '#f0ece4',
    openings: [
      { id: 'o4', type: 'vindu', offset: 2.0, width: 1.4, height: 1.2, sillHeight: 0.9 },
      { id: 'o5', type: 'vindu', offset: 6.6, width: 1.4, height: 1.2, sillHeight: 0.9 },
    ],
  },
  // Left wall (west)
  {
    id: 'w3', start: { x: 0, y: 8 }, end: { x: 0, y: 0 },
    height: 2.6, thickness: 0.25, color: '#e8e0d4',
    openings: [
      { id: 'o6', type: 'vindu', offset: 3.0, width: 1.2, height: 1.2, sillHeight: 0.9 },
    ],
  },
  // Right wall (east)
  {
    id: 'w4', start: { x: 10, y: 0 }, end: { x: 10, y: 8 },
    height: 2.6, thickness: 0.25, color: '#e8e0d4',
    openings: [
      { id: 'o7', type: 'vindu', offset: 3.0, width: 1.2, height: 1.2, sillHeight: 0.9 },
    ],
  },
]

const DEMO_OUTDOOR: OutdoorElement[] = [
  // Terrace in front of door
  { id: 'e1', type: 'terrasse', points: [{ x: 3, y: -3.5 }, { x: 7, y: 0 }], color: '#c8a96e' },
  // Garden left
  { id: 'e2', type: 'hage', points: [{ x: -5, y: 0 }, { x: 0, y: 8 }], color: '#4a7c59' },
  // Garden right
  { id: 'e3', type: 'hage', points: [{ x: 10, y: 0 }, { x: 16, y: 7 }], color: '#5a8c65' },
  // Path from terrace to south
  { id: 'e4', type: 'sti', points: [{ x: 4.5, y: -3.5 }, { x: 5.5, y: -8 }], color: '#b0a090' },
  // Fence around property
  { id: 'e5', type: 'gjerde', points: [{ x: -6, y: -9 }, { x: 17, y: 9 }], color: '#8b7355' },
]

export const useStore = create<SceneState>((set) => ({
  walls: DEMO_WALLS,
  roof: {
    type: 'saltak',
    pitch: 32,
    overhang: 0.6,
    color: '#8b2500',
  },
  outdoorElements: DEMO_OUTDOOR,
  selectedId: null,
  activeTool: 'velg',
  viewMode: 'split',

  addWall: (wall) => {
    const id = uuidv4();
    set((state) => ({
      walls: [...state.walls, { ...wall, id, openings: [] }],
    }));
    return id;
  },

  updateWall: (id, updates) =>
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),

  deleteWall: (id) =>
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  addOpening: (wallId, opening) => {
    const id = uuidv4();
    set((state) => ({
      walls: state.walls.map((w) =>
        w.id === wallId ? { ...w, openings: [...w.openings, { ...opening, id }] } : w
      ),
    }));
  },

  updateOpening: (wallId, openingId, updates) =>
    set((state) => ({
      walls: state.walls.map((w) =>
        w.id === wallId
          ? {
              ...w,
              openings: w.openings.map((o) =>
                o.id === openingId ? { ...o, ...updates } : o
              ),
            }
          : w
      ),
    })),

  deleteOpening: (wallId, openingId) =>
    set((state) => ({
      walls: state.walls.map((w) =>
        w.id === wallId
          ? { ...w, openings: w.openings.filter((o) => o.id !== openingId) }
          : w
      ),
    })),

  updateRoof: (updates) =>
    set((state) => ({ roof: { ...state.roof, ...updates } })),

  addOutdoor: (el) => {
    const id = uuidv4();
    set((state) => ({
      outdoorElements: [...state.outdoorElements, { ...el, id }],
    }));
    return id;
  },

  updateOutdoor: (id, updates) =>
    set((state) => ({
      outdoorElements: state.outdoorElements.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  deleteOutdoor: (id) =>
    set((state) => ({
      outdoorElements: state.outdoorElements.filter((e) => e.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  setSelected: (id) => set({ selectedId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
