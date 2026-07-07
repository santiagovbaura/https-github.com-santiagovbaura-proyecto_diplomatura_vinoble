import React, { useState } from 'react';
import { Trash2, Edit2, Plus, Minus, Package, Tag, ShoppingCart, DollarSign, ArrowDownLeft, ArrowUpRight, HelpCircle, AlertCircle, Calendar } from 'lucide-react';
import { Vino, Cliente, Movimiento } from '../types';

interface VinoDetailProps {
  vino: Vino;
  clientes: Cliente[];
  movimientos: Movimiento[];
  onAddMovimiento: (type: 'entrada' | 'entrega', qty: number, clienteId: string | null, note: string) => void;
  onEditVino: (updated: Partial<Vino>) => void;
  onDeleteVino: () => void;
}

export default function VinoDetail({
  vino,
  clientes,
  movimientos,
  onAddMovimiento,
  onEditVino,
  onDeleteVino,
}: VinoDetailProps) {
  const [activeForm, setActiveForm] = useState<'entrada' | 'entrega' | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [qty, setQty] = useState<string>('');
  const [clienteId, setClienteId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Editing states
  const [editBodega, setEditBodega] = useState(vino.bodega);
  const [editEtiqueta, setEditEtiqueta] = useState(vino.etiqueta);
  const [editCepa, setEditCepa] = useState(vino.cepa);
  const [editProveedor, setEditProveedor] = useState(vino.proveedor);
  const [editCosto, setEditCosto] = useState(String(vino.precioCosto));
  const [editVenta, setEditVenta] = useState(String(vino.precioVenta));

  // Filter movements for this wine and sort descending by date
  const wineMovs = movimientos
    .filter((m) => m.vinoId === vino.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenForm = (type: 'entrada' | 'entrega') => {
    setActiveForm(type);
    setQty('');
    setNote('');
    setFormError('');
    if (type === 'entrega') {
      // Pre-select first client if available
      setClienteId(clientes[0]?.id || '');
    } else {
      setClienteId('');
    }
  };

  const handleCancelForm = () => {
    setActiveForm(null);
    setFormError('');
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedQty = parseInt(qty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError('La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    if (activeForm === 'entrega') {
      if (!clienteId) {
        setFormError('Debe seleccionar un cliente para la entrega.');
        return;
      }
      if (parsedQty > vino.stock) {
        setFormError(`Stock insuficiente. Solo hay ${vino.stock} botellas disponibles.`);
        return;
      }
    }

    onAddMovimiento(
      activeForm!,
      parsedQty,
      activeForm === 'entrega' ? clienteId : null,
      note.trim()
    );

    setActiveForm(null);
    setQty('');
    setNote('');
  };

  const handleStartEdit = () => {
    setEditBodega(vino.bodega);
    setEditEtiqueta(vino.etiqueta);
    setEditCepa(vino.cepa);
    setEditProveedor(vino.proveedor);
    setEditCosto(String(vino.precioCosto));
    setEditVenta(String(vino.precioVenta));
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBodega.trim() || !editEtiqueta.trim()) {
      alert('La bodega y etiqueta son obligatorias.');
      return;
    }

    onEditVino({
      bodega: editBodega.trim(),
      etiqueta: editEtiqueta.trim(),
      cepa: editCepa.trim(),
      proveedor: editProveedor.trim(),
      precioCosto: Number(editCosto) || 0,
      precioVenta: Number(editVenta) || 0,
    });
    setIsEditing(false);
  };

  const getClienteName = (id: string | null) => {
    if (!id) return '—';
    const c = clientes.find((x) => x.id === id);
    return c ? c.nombre : 'Cliente eliminado';
  };

  const formatMoney = (n: number) => {
    return '$' + Math.round(n).toLocaleString('es-AR');
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return (
      d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="space-y-6" id={`vino-detail-panel-${vino.id}`}>
      {/* Title Header */}
      {!isEditing ? (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-wine-border/40 pb-5">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl tracking-tight text-wine-text">
              {vino.bodega}
            </h2>
            <div className="font-display text-base text-wine-gold font-medium">
              {vino.etiqueta}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-wine-surface border border-wine-border/60 py-2.5 px-4 rounded-xl self-start">
            <div className="p-2 bg-wine-surface2 rounded-lg text-wine-amber">
              <Package size={20} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-display leading-none text-wine-text">
                {vino.stock}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-wine-dim mt-0.5">
                botellas en stock
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveEdit} className="bg-wine-surface border border-wine-border p-5 rounded-xl space-y-4" id="form-edit-vino">
          <h3 className="font-display font-semibold text-base text-wine-gold">Editar Datos del Vino</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Bodega *</label>
              <input
                type="text"
                value={editBodega}
                onChange={(e) => setEditBodega(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Etiqueta *</label>
              <input
                type="text"
                value={editEtiqueta}
                onChange={(e) => setEditEtiqueta(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Cepa</label>
              <input
                type="text"
                value={editCepa}
                onChange={(e) => setEditCepa(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                placeholder="Malbec, Blend, etc."
              />
            </div>
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Proveedor</label>
              <input
                type="text"
                value={editProveedor}
                onChange={(e) => setEditProveedor(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
              />
            </div>
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Precio Costo ($)</label>
              <input
                type="number"
                min="0"
                value={editCosto}
                onChange={(e) => setEditCosto(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
              />
            </div>
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Precio Venta ($)</label>
              <input
                type="number"
                min="0"
                value={editVenta}
                onChange={(e) => setEditVenta(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-transparent text-wine-dim hover:text-wine-text border border-transparent rounded-md text-xs font-mono transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-wine-surface2 text-wine-gold border border-wine-gold/40 hover:border-wine-gold hover:bg-wine-surface2/80 rounded-md text-xs font-mono transition-all cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {/* Info Cards Grid */}
      {!isEditing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-wine-surface border border-wine-border/40 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-wine-faint">Cepa / Uva</span>
            <span className="text-xs text-wine-text font-semibold mt-1.5 truncate">{vino.cepa || '—'}</span>
          </div>
          <div className="bg-wine-surface border border-wine-border/40 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-wine-faint">Proveedor</span>
            <span className="text-xs text-wine-text font-semibold mt-1.5 truncate">{vino.proveedor || '—'}</span>
          </div>
          <div className="bg-wine-surface border border-wine-border/40 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-wine-faint">Costo</span>
            <span className="text-xs text-wine-green font-semibold mt-1.5">{formatMoney(vino.precioCosto)}</span>
          </div>
          <div className="bg-wine-surface border border-wine-border/40 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-wine-faint">Venta</span>
            <span className="text-xs text-wine-amber font-semibold mt-1.5">{formatMoney(vino.precioVenta)}</span>
          </div>
        </div>
      )}

      {/* Action triggers and edit/delete */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleOpenForm('entrada')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg border font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeForm === 'entrada'
              ? 'bg-wine-green/10 border-wine-green text-wine-green'
              : 'bg-transparent border-wine-green-dim text-wine-green hover:bg-wine-green/5'
          }`}
          id="btn-recibir-stock"
        >
          <ArrowDownLeft size={16} />
          Recibir Stock
        </button>
        <button
          onClick={() => handleOpenForm('entrega')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg border font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeForm === 'entrega'
              ? 'bg-wine-amber/10 border-wine-amber text-wine-amber'
              : 'bg-transparent border-wine-amber-dim text-wine-amber hover:bg-wine-amber/5'
          }`}
          id="btn-entregar-cliente"
        >
          <ArrowUpRight size={16} />
          Entregar a Cliente
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="p-2.5 text-wine-dim hover:text-wine-text bg-wine-surface border border-wine-border/50 rounded-lg hover:border-wine-faint/60 transition-all cursor-pointer"
              title="Editar datos del vino"
              id="btn-editar-vino"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`¿Está seguro de eliminar el vino "${vino.bodega} — ${vino.etiqueta}" y todo su historial de movimientos?`)) {
                onDeleteVino();
              }
            }}
            className="p-2.5 text-wine-faint hover:text-red-400 bg-wine-surface border border-wine-border/50 rounded-lg hover:border-red-400/40 transition-all cursor-pointer"
            title="Eliminar vino"
            id="btn-eliminar-vino"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Movement registration form */}
      {activeForm && (
        <form
          onSubmit={handleConfirmMovement}
          className="bg-wine-surface border-2 border-dashed border-wine-border p-5 rounded-xl space-y-4 animate-fadeIn"
          id="movement-input-form"
        >
          <div className="flex items-center justify-between border-b border-wine-border/40 pb-2">
            <h4 className="font-display font-semibold text-sm flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeForm === 'entrada' ? 'bg-wine-green' : 'bg-wine-amber'}`} />
              Registrar {activeForm === 'entrada' ? 'Entrada de Mercadería' : 'Entrega a Cliente'}
            </h4>
            <span className="text-[10px] text-wine-faint uppercase font-bold">Paso 2 de 2</span>
          </div>

          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeForm === 'entrega' && (
              <div className="sm:col-span-2">
                <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Cliente *</label>
                {clientes.length > 0 ? (
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                    required
                  >
                    <option value="" disabled>Seleccione un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.codigo ? `[Cod: ${c.codigo}]` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-wine-amber py-2">
                    ¡No tienes clientes registrados! Ve a la pestaña de Clientes para agregar uno.
                  </div>
                )}
              </div>
            )}

            <div className={activeForm === 'entrada' ? 'sm:col-span-3' : 'sm:col-span-1'}>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Cantidad (botellas) *</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 12"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Nota / Observación</label>
            <input
              type="text"
              placeholder={activeForm === 'entrada' ? 'Ej. Compra a proveedor distribuidor' : 'Ej. Envío directo restaurante'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 bg-transparent text-wine-dim hover:text-wine-text border border-transparent rounded-md text-xs font-mono transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-xs font-mono font-bold tracking-wide transition-all border cursor-pointer ${
                activeForm === 'entrada'
                  ? 'bg-wine-green/10 text-wine-green border-wine-green/40 hover:border-wine-green'
                  : 'bg-wine-amber/10 text-wine-amber border-wine-amber/40 hover:border-wine-amber'
              }`}
            >
              Confirmar {activeForm === 'entrada' ? 'Ingreso' : 'Entrega'}
            </button>
          </div>
        </form>
      )}

      {/* Movements list table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-wine-border/40 pb-2.5">
          <h3 className="font-display font-semibold text-sm text-wine-dim tracking-wide flex items-center gap-1.5">
            <Calendar size={14} className="text-wine-faint" />
            Historial de Movimientos
          </h3>
          <span className="text-[10px] text-wine-faint font-mono">
            {wineMovs.length} movimientos
          </span>
        </div>

        {wineMovs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-wine-border text-[10px] text-wine-faint uppercase tracking-wider">
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2">Detalle / Cliente</th>
                  <th className="py-2.5 px-2 text-right">Cant.</th>
                  <th className="py-2.5 px-2 text-right">Saldo</th>
                  <th className="py-2.5 px-2 max-w-[150px] truncate">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-border/30">
                {wineMovs.map((m) => (
                  <tr key={m.id} className="hover:bg-wine-surface2/20 transition-all">
                    <td className="py-2.5 px-2 text-wine-dim/90 whitespace-nowrap">
                      {formatDate(m.date)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${
                          m.type === 'entrada'
                            ? 'bg-wine-green/15 text-wine-green'
                            : 'bg-wine-amber/15 text-wine-amber'
                        }`}
                      >
                        {m.type === 'entrada' ? 'ENTRADA' : 'ENTREGA'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-wine-text font-medium truncate max-w-[160px]">
                      {m.type === 'entrada' ? 'Proveedor directo' : getClienteName(m.clienteId)}
                    </td>
                    <td
                      className={`py-2.5 px-2 text-right font-bold ${
                        m.type === 'entrada' ? 'text-wine-green' : 'text-wine-amber'
                      }`}
                    >
                      {m.type === 'entrada' ? '+' : '-'}{m.qty}
                    </td>
                    <td className="py-2.5 px-2 text-right text-wine-text font-semibold">
                      {m.balanceAfter}
                    </td>
                    <td className="py-2.5 px-2 text-wine-dim/70 italic truncate max-w-[150px]" title={m.note}>
                      {m.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-wine-faint italic border border-dashed border-wine-border/40 rounded-xl">
            Aún no se registran movimientos para este vino.
          </div>
        )}
      </div>
    </div>
  );
}
