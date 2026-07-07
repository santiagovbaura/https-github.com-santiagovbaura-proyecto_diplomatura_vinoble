import { AppState } from './types';

export const STORAGE_KEY = 'vinos-data-v1';

export const DEFAULT_DATA: AppState = {
  vinos: [
    { id: 'v1', bodega: 'Catena Zapata', etiqueta: 'Angelica Zapata', cepa: 'Malbec', proveedor: 'Distribuidora Cuyo', precioCosto: 12000, precioVenta: 18500, stock: 48 },
    { id: 'v2', bodega: 'Rutini', etiqueta: 'Rutini Cabernet', cepa: 'Cabernet', proveedor: 'Distribuidora Cuyo', precioCosto: 11000, precioVenta: 16800, stock: 24 },
    { id: 'v3', bodega: 'El Enemigo', etiqueta: 'El Enemigo Chardonnay', cepa: 'Chardonnay', proveedor: 'Vinoteca Mayorista', precioCosto: 14000, precioVenta: 22000, stock: 12 },
    { id: 'v4', bodega: 'Luigi Bosca', etiqueta: 'Luigi Bosca De Sangre', cepa: 'Blend', proveedor: 'Distribuidora Cuyo', precioCosto: 13500, precioVenta: 20500, stock: 30 },
    { id: 'v5', bodega: 'Zuccardi', etiqueta: 'Serie A', cepa: 'Bonarda', proveedor: 'Bodega Directo', precioCosto: 8500, precioVenta: 13200, stock: 60 }
  ],
  clientes: [
    { id: 'c101', nombre: 'Resto El Cauce Puerto Madro', codigo: '101' },
    { id: 'c102', nombre: 'Vinoteca San Telmo', codigo: '102' },
    { id: 'c103', nombre: 'Hotel Plaza S.A.', codigo: '103' },
    { id: 'c104', nombre: 'Leo Messi (Particular)', codigo: '104' }
  ],
  movimientos: []
};

export function generateId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function loadSavedState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all keys are present
      return {
        vinos: parsed.vinos || [],
        clientes: parsed.clientes || [],
        movimientos: parsed.movimientos || []
      };
    }
  } catch (e) {
    console.error('Error reading localStorage data', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state to localStorage', e);
  }
}
