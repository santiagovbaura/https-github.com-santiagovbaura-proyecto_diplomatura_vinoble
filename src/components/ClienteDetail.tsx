import React, { useState } from 'react';
import { Truck, Trash2, Edit2, Plus, Calendar, AlertCircle, ShoppingBag } from 'lucide-react';
import { Cliente, Vino, Movimiento } from '../types';

interface ClienteDetailProps {
  cliente: Cliente;
  vinos: Vino[];
  movimientos: Movimiento[];
  onAddEntrega: (vinoId: string, qty: number, note: string) => void;
  onEditCliente: (updated: Partial<Cliente>) => void;
  onDeleteCliente: () => void;
}

export default function ClienteDetail({
  cliente,
  vinos,
  movimientos,
  onAddEntrega,
  onEditCliente,
  onDeleteCliente,
}: ClienteDetailProps) {
  const [showEntregaForm, setShowEntregaForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [vinoId, setVinoId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Editing states
  const [editNombre, setEditNombre] = useState(cliente.nombre);
  const [editCodigo, setEditCodigo] = useState(cliente.codigo);

  // Filter deliveries belonging strictly to this client
  const clientMovs = movimientos
    .filter((m) => m.type === 'entrega' && m.clienteId === cliente.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate total bottles delivered
  const totalEntregas = clientMovs.reduce((acc, curr) => acc + curr.qty, 0);

  // Calculate total breakdown grouped by Wine ID
  const breakdown: { [vinoId: string]: number } = {};
  clientMovs.forEach((m) => {
    breakdown[m.vinoId] = (breakdown[m.vinoId] || 0) + m.qty;
  });

  const getVinoDetails = (id: string) => {
    const v = vinos.find((x) => x.id === id);
    return v ? `${v.bodega} — ${v.etiqueta}` : 'Vino eliminado';
  };

  const handleOpenForm = () => {
    setShowEntregaForm(true);
    setVinoId(vinos[0]?.id || '');
    setQty('');
    setNote('');
    setFormError('');
  };

  const handleConfirmEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!vinoId) {
      setFormError('Debe seleccionar un vino para entregar.');
      return;
    }

    const selectedVino = vinos.find((v) => v.id === vinoId);
    if (!selectedVino) {
      setFormError('Vino inválido.');
      return;
    }

    const parsedQty = parseInt(qty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError('La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    if (parsedQty > selectedVino.stock) {
      setFormError(`Stock insuficiente del vino seleccionado. Solo hay ${selectedVino.stock} botellas en stock.`);
      return;
    }

    onAddEntrega(vinoId, parsedQty, note.trim());
    setShowEntregaForm(false);
    setQty('');
    setNote('');
  };

  const handleStartEdit = () => {
    setEditNombre(cliente.nombre);
    setEditCodigo(cliente.codigo);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim()) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }

    onEditCliente({
      nombre: editNombre.trim(),
      codigo: editCodigo.trim(),
    });
    setIsEditing(false);
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
    <div className="space-y-6" id={`cliente-detail-panel-${cliente.id}`}>
      {/* Title Header */}
      {!isEditing ? (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-wine-border/40 pb-5">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl tracking-tight text-wine-text">
              {cliente.nombre}
            </h2>
            <div className="font-mono text-xs text-wine-gold uppercase tracking-wider">
              {cliente.codigo ? `Código: ${cliente.codigo}` : 'Sin código asignado'}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-wine-surface border border-wine-border/60 py-2.5 px-4 rounded-xl self-start">
            <div className="p-2 bg-wine-surface2 rounded-lg text-wine-amber">
              <Truck size={20} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-display leading-none text-wine-text">
                {totalEntregas}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-wine-dim mt-0.5">
                botellas entregadas
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveEdit} className="bg-wine-surface border border-wine-border p-5 rounded-xl space-y-4" id="form-edit-cliente">
          <h3 className="font-display font-semibold text-base text-wine-gold">Editar Datos del Cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Nombre / Razón Social *</label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Código (Opcional)</label>
              <input
                type="text"
                value={editCodigo}
                onChange={(e) => setEditCodigo(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                placeholder="101, B22, etc."
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

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleOpenForm}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg border font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            showEntregaForm
              ? 'bg-wine-amber/10 border-wine-amber text-wine-amber'
              : 'bg-transparent border-wine-amber-dim text-wine-amber hover:bg-wine-amber/5'
          }`}
          id="btn-cliente-nueva-entrega"
        >
          <Plus size={16} />
          Nueva Entrega
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="p-2.5 text-wine-dim hover:text-wine-text bg-wine-surface border border-wine-border/50 rounded-lg hover:border-wine-faint/60 transition-all cursor-pointer"
              title="Editar cliente"
              id="btn-editar-cliente"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`¿Está seguro de eliminar el cliente "${cliente.nombre}" y todo su historial de entregas?`)) {
                onDeleteCliente();
              }
            }}
            className="p-2.5 text-wine-faint hover:text-red-400 bg-wine-surface border border-wine-border/50 rounded-lg hover:border-red-400/40 transition-all cursor-pointer"
            title="Eliminar cliente"
            id="btn-eliminar-cliente"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expandable delivery form */}
      {showEntregaForm && (
        <form
          onSubmit={handleConfirmEntrega}
          className="bg-wine-surface border-2 border-dashed border-wine-border p-5 rounded-xl space-y-4 animate-fadeIn"
          id="delivery-input-form"
        >
          <div className="flex items-center justify-between border-b border-wine-border/40 pb-2">
            <h4 className="font-display font-semibold text-sm flex items-center gap-1.5 text-wine-amber">
              <Truck size={14} />
              Registrar Entrega de Botellas
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
            <div className="sm:col-span-2">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Vino a Entregar *</label>
              {vinos.length > 0 ? (
                <select
                  value={vinoId}
                  onChange={(e) => setVinoId(e.target.value)}
                  className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
                  required
                >
                  <option value="" disabled>Seleccione un vino</option>
                  {vinos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.bodega} — {v.etiqueta} ({v.stock} disp.)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-wine-amber py-2">
                  ¡No tienes vinos registrados en stock! Agrega un vino primero en la pestaña de Vinos.
                </div>
              )}
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 6"
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
              placeholder="Ej. Entrega para evento de fin de semana"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-wine-bg border border-wine-border rounded px-3 py-2 text-sm text-wine-text focus:outline-none focus:border-wine-faint"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowEntregaForm(false)}
              className="px-4 py-2 bg-transparent text-wine-dim hover:text-wine-text border border-transparent rounded-md text-xs font-mono transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-xs font-mono font-bold tracking-wide transition-all border cursor-pointer bg-wine-amber/10 text-wine-amber border-wine-amber/40 hover:border-wine-amber"
            >
              Confirmar Entrega
            </button>
          </div>
        </form>
      )}

      {/* Breakdown by Wine type */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-wine-border/40 pb-2">
          <h3 className="font-display font-semibold text-sm text-wine-dim tracking-wide flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-wine-faint" />
            Consumo Acumulado por Vino
          </h3>
        </div>

        {Object.keys(breakdown).length > 0 ? (
          <div className="overflow-x-auto bg-wine-surface/20 border border-wine-border/30 rounded-lg p-2.5">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-wine-border/60 text-[10px] text-wine-faint uppercase tracking-wider">
                  <th className="py-2 px-2">Vino</th>
                  <th className="py-2 px-2 text-right">Total Botellas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-border/20">
                {Object.entries(breakdown).map(([id, qty]) => (
                  <tr key={id} className="hover:bg-wine-surface2/20">
                    <td className="py-2 px-2 text-wine-text font-medium">
                      {getVinoDetails(id)}
                    </td>
                    <td className="py-2 px-2 text-right text-wine-amber font-bold">
                      {qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-wine-faint italic">
            Sin entregas registradas.
          </div>
        )}
      </div>

      {/* Full History of Deliveries to this specific client */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-wine-border/40 pb-2.5">
          <h3 className="font-display font-semibold text-sm text-wine-dim tracking-wide flex items-center gap-1.5">
            <Calendar size={14} className="text-wine-faint" />
            Historial de Entregas
          </h3>
          <span className="text-[10px] text-wine-faint font-mono">
            {clientMovs.length} entregas
          </span>
        </div>

        {clientMovs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-wine-border text-[10px] text-wine-faint uppercase tracking-wider">
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2">Vino</th>
                  <th className="py-2.5 px-2 text-right">Cantidad</th>
                  <th className="py-2.5 px-2 max-w-[200px] truncate">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-border/30">
                {clientMovs.map((m) => (
                  <tr key={m.id} className="hover:bg-wine-surface2/20 transition-all">
                    <td className="py-2.5 px-2 text-wine-dim/90 whitespace-nowrap">
                      {formatDate(m.date)}
                    </td>
                    <td className="py-2.5 px-2 text-wine-text font-medium truncate max-w-[220px]">
                      {getVinoDetails(m.vinoId)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-wine-amber">
                      {m.qty} botellas
                    </td>
                    <td className="py-2.5 px-2 text-wine-dim/70 italic truncate max-w-[200px]" title={m.note}>
                      {m.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-wine-faint italic border border-dashed border-wine-border/40 rounded-xl">
            No se han registrado entregas para este cliente aún.
          </div>
        )}
      </div>
    </div>
  );
}
