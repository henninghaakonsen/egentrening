export interface Point {
  x: number;
  y: number;
}

export interface Opening {
  id: string;
  type: 'vindu' | 'dør';
  offset: number;    // distance from wall start (m)
  width: number;     // m
  height: number;    // m
  sillHeight: number; // height from floor (0 for doors)
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  height: number;    // m, default 2.4
  thickness: number; // m, default 0.2
  openings: Opening[];
  color: string;
}

export type RoofType = 'ingen' | 'flatt' | 'saltak';

export interface Roof {
  type: RoofType;
  pitch: number;    // degrees, default 30
  overhang: number; // m, default 0.5
  color: string;
}

export type OutdoorType = 'terrasse' | 'sti' | 'hage' | 'gjerde';

export interface OutdoorElement {
  id: string;
  type: OutdoorType;
  points: Point[]; // 2 points for rect, multiple for fence
  color?: string;
}

export type ToolType =
  | 'velg'
  | 'vegg'
  | 'vindu'
  | 'dør'
  | 'tak'
  | 'terrasse'
  | 'sti'
  | 'hage'
  | 'gjerde';

export type ViewMode = '2d' | '3d' | 'split';

export interface SceneState {
  walls: Wall[];
  roof: Roof;
  outdoorElements: OutdoorElement[];
  selectedId: string | null;
  activeTool: ToolType;
  viewMode: ViewMode;

  // Actions
  addWall: (wall: Omit<Wall, 'id' | 'openings'>) => string;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;

  addOpening: (wallId: string, opening: Omit<Opening, 'id'>) => void;
  updateOpening: (wallId: string, openingId: string, updates: Partial<Opening>) => void;
  deleteOpening: (wallId: string, openingId: string) => void;

  updateRoof: (updates: Partial<Roof>) => void;

  addOutdoor: (el: Omit<OutdoorElement, 'id'>) => string;
  updateOutdoor: (id: string, updates: Partial<OutdoorElement>) => void;
  deleteOutdoor: (id: string) => void;

  setSelected: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setViewMode: (mode: ViewMode) => void;
}
