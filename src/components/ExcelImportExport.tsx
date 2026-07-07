import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Vino, Cliente, AppState } from '../types';
import { generateId } from '../data';

interface ExcelImportExportProps {
  activeTab: 'vinos' | 'clientes';
  state: AppState;
  onImportComplete: (newState: Partial<AppState>, summary: string) => void;
}

export default function ExcelImportExport({ activeTab, state, onImportComplete }: ExcelImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelper, setShowHelper] = useState(false);

  function normalizeHeader(h: any): string {
    return String(h || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  function findCol(headers: any[], candidates: string[]): number {
    const norm = headers.map(normalizeHeader);
    for (const cand of candidates) {
      const idx = norm.indexOf(normalizeHeader(cand));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (rows.length === 0) {
          alert('El archivo Excel está vacío.');
          return;
        }

        const headers = rows[0];
        let added = 0;
        let updated = 0;

        if (activeTab === 'vinos') {
          const cBodega = findCol(headers, ['marca_bodega', 'bodega', 'marca', 'winery']);
          const cEtiqueta = findCol(headers, ['etiqueta_nombre', 'etiqueta', 'nombre', 'label']);
          const cCepa = findCol(headers, ['tipo_uva', 'cepa', 'varietal', 'grape']);
          const cProveedor = findCol(headers, ['proveedor', 'provider', 'vendor']);
          const cCosto = findCol(headers, ['precio_costo', 'costo', 'cost']);
          const cVenta = findCol(headers, ['precio_venta', 'venta', 'precio', 'price']);
          const cStock = findCol(headers, ['stock_actual', 'stock', 'cantidad', 'qty']);

          const updatedVinos = [...state.vinos];

          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;

            const bodega = cBodega !== -1 ? String(r[cBodega] || '').trim() : '';
            const etiqueta = cEtiqueta !== -1 ? String(r[cEtiqueta] || '').trim() : '';

            // Skip empty rows
            if (!bodega && !etiqueta) continue;

            const existingIdx = updatedVinos.findIndex(
              (v) =>
                v.bodega.toLowerCase() === bodega.toLowerCase() &&
                v.etiqueta.toLowerCase() === etiqueta.toLowerCase()
            );

            const itemData = {
              bodega: bodega || 'Bodega Desconocida',
              etiqueta: etiqueta || 'Sin etiqueta',
              cepa: cCepa !== -1 ? String(r[cCepa] || '').trim() : '',
              proveedor: cProveedor !== -1 ? String(r[cProveedor] || '').trim() : '',
              precioCosto: cCosto !== -1 ? Number(r[cCosto]) || 0 : 0,
              precioVenta: cVenta !== -1 ? Number(r[cVenta]) || 0 : 0,
              stock: cStock !== -1 ? Math.round(Number(r[cStock]) || 0) : 0,
            };

            if (existingIdx !== -1) {
              updatedVinos[existingIdx] = {
                ...updatedVinos[existingIdx],
                ...itemData,
              };
              updated++;
            } else {
              updatedVinos.push({
                id: generateId('v'),
                ...itemData,
              });
              added++;
            }
          }

          onImportComplete(
            { vinos: updatedVinos },
            `Importación completada: ${added} vinos nuevos creados y ${updated} actualizados.`
          );
        } else {
          // Clientes
          const cNombre = findCol(headers, ['nombre_razon_social', 'nombre', 'razonsocial', 'cliente', 'name']);
          const cCodigo = findCol(headers, ['codigo', 'code', 'id_cliente']);

          const updatedClientes = [...state.clientes];

          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;

            const nombre = cNombre !== -1 ? String(r[cNombre] || '').trim() : '';
            if (!nombre) continue;

            const codigo = cCodigo !== -1 ? String(r[cCodigo] || '').trim() : '';

            const existingIdx = updatedClientes.findIndex(
              (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
            );

            if (existingIdx !== -1) {
              updatedClientes[existingIdx] = {
                ...updatedClientes[existingIdx],
                codigo: codigo || updatedClientes[existingIdx].codigo,
              };
              updated++;
            } else {
              updatedClientes.push({
                id: generateId('c'),
                nombre,
                codigo,
              });
              added++;
            }
          }

          onImportComplete(
            { clientes: updatedClientes },
            `Importación completada: ${added} clientes nuevos creados y ${updated} actualizados.`
          );
        }
      } catch (err) {
        console.error(err);
        alert('No se pudo procesar el archivo Excel. Verifique el formato e intente nuevamente.');
      }

      // Reset value so we can trigger again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: any[] = [];
    let filename = '';

    if (activeTab === 'vinos') {
      headers = ['Bodega', 'Etiqueta', 'Cepa', 'Proveedor', 'Precio Costo', 'Precio Venta', 'Stock Actual'];
      sampleData = [
        ['Catena Zapata', 'Nicasia Red Blend', 'Malbec', 'Distribuidora Cuyo', 11500, 17500, 24],
        ['Rutini', 'Rutini Sauvignon Blanc', 'Sauvignon Blanc', 'Bodega Directo', 9500, 14900, 12],
      ];
      filename = 'Plantilla_Vinos_Control.xlsx';
    } else {
      headers = ['Nombre', 'Codigo'];
      sampleData = [
        ['Restaurante Las Lilas', '105'],
        ['La Cabrera San Telmo', '106'],
      ];
      filename = 'Plantilla_Clientes_Control.xlsx';
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'vinos' ? 'Vinos' : 'Clientes');
    XLSX.writeFile(wb, filename);
  };

  const exportCurrentData = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Vinos
    const vinosHeaders = ['ID', 'Bodega', 'Etiqueta', 'Cepa', 'Proveedor', 'Precio Costo', 'Precio Venta', 'Stock Actual'];
    const vinosRows = state.vinos.map(v => [v.id, v.bodega, v.etiqueta, v.cepa, v.proveedor, v.precioCosto, v.precioVenta, v.stock]);
    const wsVinos = XLSX.utils.aoa_to_sheet([vinosHeaders, ...vinosRows]);
    XLSX.utils.book_append_sheet(wb, wsVinos, 'Vinos');

    // Sheet 2: Clientes
    const clientesHeaders = ['ID', 'Nombre', 'Código'];
    const clientesRows = state.clientes.map(c => [c.id, c.nombre, c.codigo]);
    const wsClientes = XLSX.utils.aoa_to_sheet([clientesHeaders, ...clientesRows]);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

    // Sheet 3: Historial
    const movsHeaders = ['ID', 'Fecha', 'Vino', 'Tipo', 'Cantidad', 'Cliente', 'Saldo Post-Mov', 'Nota'];
    const movsRows = state.movimientos.map(m => {
      const v = state.vinos.find(x => x.id === m.vinoId);
      const c = state.clientes.find(x => x.id === m.clienteId);
      const vinoStr = v ? `${v.bodega} — ${v.etiqueta}` : 'Vino eliminado';
      const clienteStr = c ? c.nombre : (m.type === 'entrada' ? '—' : 'Consumo / Directo');
      return [
        m.id,
        new Date(m.date).toLocaleString('es-AR'),
        vinoStr,
        m.type === 'entrada' ? 'Entrada' : 'Entrega',
        m.qty,
        clienteStr,
        m.balanceAfter,
        m.note
      ];
    });
    const wsMovs = XLSX.utils.aoa_to_sheet([movsHeaders, ...movsRows]);
    XLSX.utils.book_append_sheet(wb, wsMovs, 'Movimientos');

    XLSX.writeFile(wb, 'Bodega_Control_Vinos_Export.xlsx');
  };

  return (
    <div className="mt-4 border-t border-wine-border/60 pt-4" id="excel-import-export-module">
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-wine-surface2 text-wine-text border border-wine-border rounded-md hover:bg-wine-border hover:border-wine-faint/40 active:scale-[0.98] transition-all text-xs font-mono font-medium cursor-pointer"
          id="btn-importar-excel"
          title={`Importar archivo Excel de ${activeTab}`}
        >
          <Upload size={14} className="text-wine-green" />
          Importar Excel
        </button>
        <button
          onClick={exportCurrentData}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-wine-surface2 text-wine-text border border-wine-border rounded-md hover:bg-wine-border hover:border-wine-faint/40 active:scale-[0.98] transition-all text-xs font-mono font-medium cursor-pointer"
          id="btn-exportar-todo"
          title="Exportar todo el inventario, clientes e historial a Excel"
        >
          <Download size={14} className="text-wine-amber" />
          Exportar Todo
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImport}
        id="file-excel-picker"
      />

      <div className="mt-2.5 flex items-center justify-between">
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="text-[11px] text-wine-dim underline underline-offset-4 decoration-dotted hover:text-wine-text flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
          id="btn-ver-instrucciones"
        >
          <HelpCircle size={11} className="text-wine-faint" />
          Ver formato sugerido
        </button>
        <button
          onClick={downloadTemplate}
          className="text-[11px] text-wine-gold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 font-medium"
          id="btn-descargar-plantilla"
        >
          <FileSpreadsheet size={11} />
          Descargar plantilla
        </button>
      </div>

      {showHelper && (
        <div className="mt-3 p-3 bg-wine-surface border border-wine-border/80 rounded-lg text-[11px] leading-relaxed text-wine-dim space-y-2 animate-fadeIn" id="excel-instructions-box">
          <p className="font-semibold text-wine-text flex items-center gap-1">
            <CheckCircle size={12} className="text-wine-green" />
            Columnas soportadas ({activeTab === 'vinos' ? 'Vinos' : 'Clientes'}):
          </p>
          {activeTab === 'vinos' ? (
            <ul className="list-disc pl-4 space-y-1 text-wine-dim/90">
              <li><strong className="text-wine-text">Bodega:</strong> Marca o productor (ej. Catena Zapata, Rutini)</li>
              <li><strong className="text-wine-text">Etiqueta:</strong> Nombre de la línea (ej. Angelica, Cabernet)</li>
              <li><strong className="text-wine-text">Cepa / Varietal:</strong> Malbec, Blend, Chardonnay...</li>
              <li><strong className="text-wine-text">Proveedor:</strong> Quién distribuye</li>
              <li><strong className="text-wine-text">Precio Costo / Venta:</strong> Numérico sin símbolos</li>
              <li><strong className="text-wine-text">Stock:</strong> Cantidad inicial de botellas</li>
            </ul>
          ) : (
            <ul className="list-disc pl-4 space-y-1 text-wine-dim/90">
              <li><strong className="text-wine-text">Nombre:</strong> Razón social o nombre del cliente</li>
              <li><strong className="text-wine-text">Código:</strong> Identificador numérico o abreviación (opcional)</li>
            </ul>
          )}
          <p className="text-[10px] text-wine-faint border-t border-wine-border/40 pt-1.5 mt-2">
            * El sistema auto-detecta las cabeceras basándose en sinónimos comunes (ej: 'costo', 'precio_costo', 'precio costo'). Si detecta coincidencia de Bodega y Etiqueta (o Nombre), actualiza el registro en vez de duplicarlo.
          </p>
        </div>
      )}
    </div>
  );
}
