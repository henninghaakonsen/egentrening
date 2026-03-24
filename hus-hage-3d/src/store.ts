import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SceneState, Wall, Opening, OutdoorElement, Roof } from './types';

export const useStore = create<SceneState>((set) => ({
  walls: [],
  roof: {
    type: 'saltak',
    pitch: 30,
    overhang: 0.5,
    color: '#c0392b',
  },
  outdoorElements: [],
  selectedId: null,
  activeTool: 'vegg',
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
