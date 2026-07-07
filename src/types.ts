export interface Vino {
  id: string;
  bodega: string;
  etiqueta: string;
  cepa: string;
  proveedor: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  codigo: string;
}

export interface Movimiento {
  id: string;
  vinoId: string;
  type: 'entrada' | 'entrega';
  qty: number;
  clienteId: string | null;
  date: string;
  note: string;
  balanceAfter: number;
}

export interface AppState {
  vinos: Vino[];
  clientes: Cliente[];
  movimientos: Movimiento[];
}
