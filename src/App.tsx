import React, { useState, useEffect } from 'react';
import { Wine, Users, Search, Plus, ChevronLeft, CheckCircle2, Info, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Vino, Cliente, Movimiento } from './types';
import { loadSavedState, saveStateToStorage, generateId, DEFAULT_DATA } from './data';
import ExcelImportExport from './components/ExcelImportExport';
import VinoDetail from './components/VinoDetail';
import ClienteDetail from './components/ClienteDetail';
import Modal from './components/Modal';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadSavedState());
  const [activeTab, setActiveTab] = useState<'vinos' | 'clientes'>('vinos');
  const [selectedVinoId, setSelectedVinoId] = useState<string | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'new-vino' | 'new-cliente' | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  // Mobil-only view state: 'list' or 'detail'
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Load default selections on mount or state change
  useEffect(() => {
    if (appState.vinos.length > 0 && !selectedVinoId) {
      setSelectedVinoId(appState.vinos[0].id);
    }
    if (appState.clientes.length > 0 && !selectedClienteId) {
      setSelectedClienteId(appState.clientes[0].id);
    }
  }, [appState, selectedVinoId, selectedClienteId]);

  // Persist state to localstorage whenever it changes
  const updateState = (newState: AppState) => {
    setAppState(newState);
    saveStateToStorage(newState);
  };

  // Import handler
  const handleImportComplete = (updatedCollections: Partial<AppState>, summary: string) => {
    const updatedState = {
      ...appState,
      ...updatedCollections,
    };
    updateState(updatedState);
    setImportSummary(summary);
    setTimeout(() => {
      setImportSummary(null);
    }, 6000);
  };

  // Add Vino
  const [nvBodega, setNvBodega] = useState('');
  const [nvEtiqueta, setNvEtiqueta] = useState('');
  const [nvCepa, setNvCepa] = useState('');
  const [nvProveedor, setNvProveedor] = useState('');
  const [nvCosto, setNvCosto] = useState('');
  const [nvVenta, setNvVenta] = useState('');
  const [nvStock, setNvStock] = useState('');

  const handleCreateVino = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nvBodega.trim() || !nvEtiqueta.trim()) return;

    const newId = generateId('v');
    const newVino: Vino = {
      id: newId,
      bodega: nvBodega.trim(),
      etiqueta: nvEtiqueta.trim(),
      cepa: nvCepa.trim(),
      proveedor: nvProveedor.trim(),
      precioCosto: Number(nvCosto) || 0,
      precioVenta: Number(nvVenta) || 0,
      stock: Math.round(Number(nvStock)) || 0,
    };

    const newState: AppState = {
      ...appState,
      vinos: [...appState.vinos, newVino],
    };

    // If there is initial stock, register an initial 'entrada' movement
    if (newVino.stock > 0) {
      const initialMov: Movimiento = {
        id: generateId('m'),
        vinoId: newId,
        type: 'entrada',
        qty: newVino.stock,
        clienteId: null,
        date: new Date().toISOString(),
        note: 'Stock inicial en creación',
        balanceAfter: newVino.stock,
      };
      newState.movimientos = [...newState.movimientos, initialMov];
    }

    updateState(newState);
    setSelectedVinoId(newId);
    setActiveModal(null);
    setMobileView('detail');

    // Reset fields
    setNvBodega('');
    setNvEtiqueta('');
    setNvCepa('');
    setNvProveedor('');
    setNvCosto('');
    setNvVenta('');
    setNvStock('');
  };

  // Add Cliente
  const [ncNombre, setNcNombre] = useState('');
  const [ncCodigo, setNcCodigo] = useState('');

  const handleCreateCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncNombre.trim()) return;

    const newId = generateId('c');
    const newCliente: Cliente = {
      id: newId,
      nombre: ncNombre.trim(),
      codigo: ncCodigo.trim(),
    };

    const newState: AppState = {
      ...appState,
      clientes: [...appState.clientes, newCliente],
    };

    updateState(newState);
    setSelectedClienteId(newId);
    setActiveModal(null);
    setMobileView('detail');

    setNcNombre('');
    setNcCodigo('');
  };

  // Movements registering
  const handleRegisterMovement = (
    type: 'entrada' | 'entrega',
    qty: number,
    clienteId: string | null,
    note: string
  ) => {
    if (activeTab === 'vinos') {
      if (!selectedVinoId) return;

      const updatedVinos = appState.vinos.map((v) => {
        if (v.id === selectedVinoId) {
          const change = type === 'entrada' ? qty : -qty;
          return { ...v, stock: Math.max(0, v.stock + change) };
        }
        return v;
      });

      const updatedVino = updatedVinos.find((v) => v.id === selectedVinoId);
      if (!updatedVino) return;

      const newMov: Movimiento = {
        id: generateId('m'),
        vinoId: selectedVinoId,
        type,
        qty,
        clienteId,
        date: new Date().toISOString(),
        note: note || (type === 'entrada' ? 'Ingreso de stock' : 'Entrega de stock'),
        balanceAfter: updatedVino.stock,
      };

      updateState({
        ...appState,
        vinos: updatedVinos,
        movimientos: [...appState.movimientos, newMov],
      });
    }
  };

  // Register delivery from the client detail pane
  const handleRegisterDeliveryFromCliente = (vinoId: string, qty: number, note: string) => {
    if (!selectedClienteId) return;

    const updatedVinos = appState.vinos.map((v) => {
      if (v.id === vinoId) {
        return { ...v, stock: Math.max(0, v.stock - qty) };
      }
      return v;
    });

    const targetVino = updatedVinos.find((v) => v.id === vinoId);
    if (!targetVino) return;

    const newMov: Movimiento = {
      id: generateId('m'),
      vinoId,
      type: 'entrega',
      qty,
      clienteId: selectedClienteId,
      date: new Date().toISOString(),
      note: note || 'Entrega registrada desde ficha de cliente',
      balanceAfter: targetVino.stock,
    };

    updateState({
      ...appState,
      vinos: updatedVinos,
      movimientos: [...appState.movimientos, newMov],
    });
  };

  // Editing Vino
  const handleEditVino = (updatedFields: Partial<Vino>) => {
    if (!selectedVinoId) return;
    const updatedVinos = appState.vinos.map((v) => {
      if (v.id === selectedVinoId) {
        return { ...v, ...updatedFields };
      }
      return v;
    });
    updateState({
      ...appState,
      vinos: updatedVinos,
    });
  };

  // Editing Cliente
  const handleEditCliente = (updatedFields: Partial<Cliente>) => {
    if (!selectedClienteId) return;
    const updatedClientes = appState.clientes.map((c) => {
      if (c.id === selectedClienteId) {
        return { ...c, ...updatedFields };
      }
      return c;
    });
    updateState({
      ...appState,
      clientes: updatedClientes,
    });
  };

  // Deleting Vino
  const handleDeleteVino = () => {
    if (!selectedVinoId) return;
    const filteredVinos = appState.vinos.filter((v) => v.id !== selectedVinoId);
    const filteredMovs = appState.movimientos.filter((m) => m.vinoId !== selectedVinoId);

    const nextSelected = filteredVinos.length > 0 ? filteredVinos[0].id : null;
    setSelectedVinoId(nextSelected);

    updateState({
      ...appState,
      vinos: filteredVinos,
      movimientos: filteredMovs,
    });

    setMobileView('list');
  };

  // Deleting Cliente
  const handleDeleteCliente = () => {
    if (!selectedClienteId) return;
    const filteredClientes = appState.clientes.filter((c) => c.id !== selectedClienteId);
    const filteredMovs = appState.movimientos.filter((m) => m.clienteId !== selectedClienteId);

    const nextSelected = filteredClientes.length > 0 ? filteredClientes[0].id : null;
    setSelectedClienteId(nextSelected);

    updateState({
      ...appState,
      clientes: filteredClientes,
      movimientos: filteredMovs,
    });

    setMobileView('list');
  };

  // Filter lists based on search string
  const filteredVinos = appState.vinos.filter(
    (v) =>
      v.bodega.toLowerCase().includes(search.toLowerCase()) ||
      v.etiqueta.toLowerCase().includes(search.toLowerCase()) ||
      v.cepa.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClientes = appState.clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to calculate total deliveries for list labels
  const getClienteTotalDeliveries = (cid: string) => {
    return appState.movimientos
      .filter((m) => m.type === 'entrega' && m.clienteId === cid)
      .reduce((s, m) => s + m.qty, 0);
  };

  // Selected entities references
  const currentVino = appState.vinos.find((v) => v.id === selectedVinoId);
  const currentCliente = appState.clientes.find((c) => c.id === selectedClienteId);

  // Reset demo data helper
  const handleResetToDemo = () => {
    if (window.confirm('¿Está seguro de restablecer los datos por defecto? Se perderá todo el historial actual.')) {
      const freshData = JSON.parse(JSON.stringify(DEFAULT_DATA));
      updateState(freshData);
      setSelectedVinoId(freshData.vinos[0]?.id || null);
      setSelectedClienteId(freshData.clientes[0]?.id || null);
      setSearch('');
    }
  };

  return (
    <div className="flex min-h-screen bg-wine-bg text-wine-text font-mono overflow-x-hidden antialiased" id="app-container">
      
      {/* 1. Sidebar Container - Sticky left sidebar */}
      <div
        className={`w-full md:w-[340px] shrink-0 bg-wine-surface border-r border-wine-border flex flex-col h-screen sticky top-0 z-20 transition-all ${
          mobileView === 'detail' ? 'hidden md:flex' : 'flex'
        }`}
        id="app-sidebar"
      >
        {/* Brand and tabs */}
        <div className="p-4 border-b border-wine-border/60 space-y-3.5 shrink-0 bg-wine-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-wine-surface2 rounded-lg flex items-center justify-center border border-wine-border">
                <Wine size={15} className="text-wine-gold" />
              </div>
              <h1 className="font-display font-bold text-base tracking-tight text-wine-text">
                Control de Vinos
              </h1>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-wine-gold border border-wine-gold/35 rounded px-1.5 py-0.5 font-bold">
              Bodega v1
            </span>
          </div>

          {/* Navigation Tab buttons */}
          <div className="flex bg-wine-bg/60 p-1 rounded-lg border border-wine-border/30">
            <button
              onClick={() => {
                setActiveTab('vinos');
                setSearch('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-md transition-all font-display font-semibold cursor-pointer ${
                activeTab === 'vinos'
                  ? 'bg-wine-surface2 text-wine-text shadow-sm border border-wine-border/60'
                  : 'text-wine-dim hover:text-wine-text border border-transparent'
              }`}
              id="tab-btn-vinos"
            >
              <Wine size={13} />
              Vinos
            </button>
            <button
              onClick={() => {
                setActiveTab('clientes');
                setSearch('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-md transition-all font-display font-semibold cursor-pointer ${
                activeTab === 'clientes'
                  ? 'bg-wine-surface2 text-wine-text shadow-sm border border-wine-border/60'
                  : 'text-wine-dim hover:text-wine-text border border-transparent'
              }`}
              id="tab-btn-clientes"
            >
              <Users size={13} />
              Clientes
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wine-faint" />
            <input
              type="text"
              placeholder={activeTab === 'vinos' ? 'Buscar vino o bodega...' : 'Buscar cliente por nombre...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-wine-bg/80 border border-wine-border/80 focus:border-wine-faint/80 rounded-lg py-2 pl-9 pr-4 text-xs text-wine-text focus:outline-none placeholder-wine-faint transition-all"
              id="sidebar-search-box"
            />
          </div>

          {/* Excel Integrator Component */}
          <ExcelImportExport
            activeTab={activeTab}
            state={appState}
            onImportComplete={handleImportComplete}
          />
        </div>

        {/* Dynamic Lists scroll view */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-wine-bg/25" id="sidebar-scrollable-list">
          <AnimatePresence mode="popLayout">
            {activeTab === 'vinos' ? (
              filteredVinos.length > 0 ? (
                filteredVinos.map((v) => (
                  <motion.div
                    key={v.id}
                    layoutId={v.id}
                    onClick={() => {
                      setSelectedVinoId(v.id);
                      setMobileView('detail');
                    }}
                    className={`p-3 rounded-lg flex items-center justify-between gap-3 border transition-all cursor-pointer select-none ${
                      v.id === selectedVinoId
                        ? 'bg-wine-surface2/90 border-wine-border/80 text-wine-text'
                        : 'bg-transparent border-transparent text-wine-dim hover:bg-wine-surface2/30 hover:text-wine-text'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">{v.bodega}</div>
                      <div className="text-[10px] text-wine-faint truncate mt-0.5">{v.etiqueta}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                          v.stock === 0
                            ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                            : 'bg-wine-bg/60 text-wine-gold'
                        }`}
                        title={`${v.stock} botellas en stock`}
                      >
                        {v.stock}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-wine-faint italic">
                  No se encontraron vinos.
                </div>
              )
            ) : filteredClientes.length > 0 ? (
              filteredClientes.map((c) => {
                const totalDel = getClienteTotalDeliveries(c.id);
                return (
                  <motion.div
                    key={c.id}
                    layoutId={c.id}
                    onClick={() => {
                      setSelectedClienteId(c.id);
                      setMobileView('detail');
                    }}
                    className={`p-3 rounded-lg flex items-center justify-between gap-3 border transition-all cursor-pointer select-none ${
                      c.id === selectedClienteId
                        ? 'bg-wine-surface2/90 border-wine-border/80 text-wine-text'
                        : 'bg-transparent border-transparent text-wine-dim hover:bg-wine-surface2/30 hover:text-wine-text'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">{c.nombre}</div>
                      <div className="text-[10px] text-wine-faint truncate mt-0.5">
                        {c.codigo ? `Cod: ${c.codigo}` : 'Sin código'}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[11px] font-mono text-wine-dim bg-wine-bg/50 px-1.5 py-0.5 rounded border border-wine-border/30">
                        {totalDel} u.
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-wine-faint italic">
                No se encontraron clientes.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Footer buttons */}
        <div className="p-3 border-t border-wine-border bg-wine-surface shrink-0 space-y-2">
          <button
            onClick={() => setActiveModal(activeTab === 'vinos' ? 'new-vino' : 'new-cliente')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-wine-gold/10 text-wine-gold border border-wine-gold/40 hover:border-wine-gold hover:bg-wine-gold/15 active:scale-[0.98] rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer font-display"
            id="sidebar-add-btn"
          >
            <Plus size={14} />
            Agregar {activeTab === 'vinos' ? 'Vino' : 'Cliente'}
          </button>
          
          <button
            onClick={handleResetToDemo}
            className="w-full text-center text-[10px] text-wine-faint hover:text-wine-dim transition-all underline decoration-dashed cursor-pointer bg-transparent border-none p-1"
            id="btn-reinicio-demo"
          >
            Restablecer datos demo
          </button>
        </div>
      </div>

      {/* 2. Main Detail Panel - Content panel on the right */}
      <div
        className={`flex-1 flex flex-col h-screen min-w-0 transition-all ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
        id="app-main-content"
      >
        {/* Mobile View Header - Back to list toggle */}
        <div className="md:hidden flex items-center border-b border-wine-border px-4 py-3 bg-wine-surface shrink-0">
          <button
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1.5 text-xs text-wine-dim hover:text-wine-text font-semibold bg-transparent border-none p-1 cursor-pointer"
            id="mobile-back-btn"
          >
            <ChevronLeft size={16} />
            Volver a la lista
          </button>
          <span className="text-xs text-wine-gold ml-auto uppercase tracking-wider font-bold">
            Ficha Detalle
          </span>
        </div>

        {/* Import Banner Banner Notification */}
        {importSummary && (
          <div className="bg-wine-green/10 border-b border-wine-green/30 p-3.5 px-6 flex items-start gap-2.5 animate-fadeIn" id="banner-notif">
            <CheckCircle2 size={16} className="text-wine-green shrink-0 mt-0.5" />
            <div className="text-xs text-wine-text font-medium">{importSummary}</div>
          </div>
        )}

        {/* Scrollable central container */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-between">
            {activeTab === 'vinos' ? (
              currentVino ? (
                <div key={currentVino.id}>
                  <VinoDetail
                    vino={currentVino}
                    clientes={appState.clientes}
                    movimientos={appState.movimientos}
                    onAddMovimiento={handleRegisterMovement}
                    onEditVino={handleEditVino}
                    onDeleteVino={handleDeleteVino}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                  <Wine size={48} className="text-wine-faint/50 animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-lg text-wine-text">Carga de Vinos</h3>
                    <p className="text-xs text-wine-dim max-w-xs leading-relaxed">
                      Agrega tu primer vino o impórtalo desde un archivo de Excel para comenzar el control de stock.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal('new-vino')}
                    className="flex items-center gap-2 py-2 px-4 bg-wine-surface2 text-wine-gold border border-wine-border rounded-lg text-xs hover:border-wine-gold/60 transition-all cursor-pointer font-semibold"
                  >
                    <Plus size={14} /> Registrar vino
                  </button>
                </div>
              )
            ) : currentCliente ? (
              <div key={currentCliente.id}>
                <ClienteDetail
                  cliente={currentCliente}
                  vinos={appState.vinos}
                  movimientos={appState.movimientos}
                  onAddEntrega={handleRegisterDeliveryFromCliente}
                  onEditCliente={handleEditCliente}
                  onDeleteCliente={handleDeleteCliente}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                <Users size={48} className="text-wine-faint/50 animate-pulse" />
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-lg text-wine-text">Ficha de Clientes</h3>
                  <p className="text-xs text-wine-dim max-w-xs leading-relaxed">
                    Registra clientes para poder realizar el seguimiento de entregas y control de botellas despachadas.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal('new-cliente')}
                  className="flex items-center gap-2 py-2 px-4 bg-wine-surface2 text-wine-gold border border-wine-border rounded-lg text-xs hover:border-wine-gold/60 transition-all cursor-pointer font-semibold"
                >
                  <Plus size={14} /> Registrar cliente
                </button>
              </div>
            )}
            
            {/* Cellar aesthetics watermark footer */}
            <div className="border-t border-wine-border/30 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-wine-faint font-mono">
              <span className="flex items-center gap-1">
                <Info size={11} />
                Sistema de Control de Stock y Logística de Bodegas.
              </span>
              <span>
                Desarrollado en React & Tailwind
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reusable Modals */}
      {/* A. Modal Nuevo Vino */}
      <Modal
        isOpen={activeModal === 'new-vino'}
        onClose={() => setActiveModal(null)}
        title="Agregar Nuevo Vino"
      >
        <form onSubmit={handleCreateVino} className="space-y-4" id="modal-form-new-vino">
          <div className="space-y-1">
            <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Bodega / Productor *</label>
            <input
              type="text"
              required
              placeholder="Ej. Catena Zapata"
              value={nvBodega}
              onChange={(e) => setNvBodega(e.target.value)}
              className="w-full bg-wine-bg border border-wine-border rounded-lg px-3 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Etiqueta / Línea de Vino *</label>
            <input
              type="text"
              required
              placeholder="Ej. Nicasia Red Blend"
              value={nvEtiqueta}
              onChange={(e) => setNvEtiqueta(e.target.value)}
              className="w-full bg-wine-bg border border-wine-border rounded-lg px-3 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Cepa / Varietal</label>
              <input
                type="text"
                placeholder="Ej. Malbec"
                value={nvCepa}
                onChange={(e) => setNvCepa(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded-lg px-3 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Proveedor</label>
              <input
                type="text"
                placeholder="Ej. Distribuidora Cuyo"
                value={nvProveedor}
                onChange={(e) => setNvProveedor(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded-lg px-3 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Costo ($)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={nvCosto}
                onChange={(e) => setNvCosto(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded-lg px-2.5 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Venta ($)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={nvVenta}
                onChange={(e) => setNvVenta(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded-lg px-2.5 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Stock Inicial</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={nvStock}
                onChange={(e) => setNvStock(e.target.value)}
                className="w-full bg-wine-bg border border-wine-border rounded-lg px-2.5 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 text-xs text-wine-dim hover:text-wine-text font-semibold rounded-lg bg-transparent border-none cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs text-wine-gold bg-wine-surface2 border border-wine-gold/40 hover:border-wine-gold rounded-lg font-semibold tracking-wide cursor-pointer hover:bg-wine-surface2/80 transition-all"
            >
              Crear Vino
            </button>
          </div>
        </form>
      </Modal>

      {/* B. Modal Nuevo Cliente */}
      <Modal
        isOpen={activeModal === 'new-cliente'}
        onClose={() => setActiveModal(null)}
        title="Registrar Nuevo Cliente"
      >
        <form onSubmit={handleCreateCliente} className="space-y-4" id="modal-form-new-cliente">
          <div className="space-y-1">
            <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Nombre / Razón Social *</label>
            <input
              type="text"
              required
              placeholder="Ej. Restaurante Las Lilas"
              value={ncNombre}
              onChange={(e) => setNcNombre(e.target.value)}
              className="w-full bg-wine-bg border border-wine-border rounded-lg px-3 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-wine-dim uppercase tracking-wider block">Código del Cliente (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. 105, RE-LILAS"
              value={ncCodigo}
              onChange={(e) => setNcCodigo(e.target.value)}
              className="w-full bg-wine-bg border border-wine-border rounded-lg px-3 py-2 text-xs text-wine-text focus:outline-none focus:border-wine-faint"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 text-xs text-wine-dim hover:text-wine-text font-semibold rounded-lg bg-transparent border-none cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs text-wine-gold bg-wine-surface2 border border-wine-gold/40 hover:border-wine-gold rounded-lg font-semibold tracking-wide cursor-pointer hover:bg-wine-surface2/80 transition-all"
            >
              Crear Cliente
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
