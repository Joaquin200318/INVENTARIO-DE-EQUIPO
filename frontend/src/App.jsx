import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Monitor, Users, Building2, Package, Search, Plus, Trash2, Edit3,
  AlertTriangle, CheckCircle2, Wrench, XCircle, ShieldCheck, LogOut, Network, Usb,
  Laptop, Printer, PhoneCall, Server, HardDrive, Cpu, RefreshCw, ChevronRight
} from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const CATEGORIES = ['PC', 'Notebook', 'Impresora', 'Telefono IP', 'Monitor', 'Switch', 'DVR/NVR'];
const STATUSES = ['Operativo', 'Requiere Mantenimiento', 'En Reparacion', 'Dado de Baja'];
const STOCK_TYPES = ['Disco SSD', 'Disco HDD', 'Memoria RAM', 'Fuente ATX', 'Monitor Backup', 'Switch / Red', 'Periferico / Cable'];

export default function App() {
  // Autenticacion y Navegacion
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Datos del Sistema
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stock, setStock] = useState([]);
  const [notification, setNotification] = useState(null);

  // Filtros de Inventario
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [deptFilter, setDeptFilter] = useState('Todos');

  // Modal de Activos IT (Crear / Editar)
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    category: 'PC',
    TeamViewer: '',
    brand_model: '',
    department_id: '',
    employee_id: '',
    connection_type: 'IP',
    ip_address: '',
    mac_address: '',
    hostname: '',
    status: 'Operativo',
    notes: ''
  });

  // Formularios de Organizacion (Departamentos y Empleados)
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', location: '' });
  const [empForm, setEmpForm] = useState({ full_name: '', email: '', position: '', department_id: '' });

  // Formulario de Stock Deposito
  const [stockForm, setStockForm] = useState({
    item_type: 'Disco SSD',
    brand_model: '',
    specs: '',
    quantity: 1,
    min_stock: 2,
    location: 'Armario A'
  });

  const isAdmin = user?.role === 'admin';

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      const [resAssets, resDepts, resEmps, resStock] = await Promise.all([
        fetch(`${API_URL}/assets`).then(r => r.json()),
        fetch(`${API_URL}/departments`).then(r => r.json()),
        fetch(`${API_URL}/employees`).then(r => r.json()),
        fetch(`${API_URL}/stock`).then(r => r.json())
      ]);
      setAssets(resAssets);
      setDepartments(resDepts);
      setEmployees(resEmps);
      setStock(resStock);
      if (resDepts.length > 0 && !selectedDeptId) {
        setSelectedDeptId(resDepts[0].id);
      }
    } catch (err) {
      notify('Error conectando con el servidor Backend', 'error');
    }
  };

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  // ============================================================================
  // HANDLERS: LOGIN
  // ============================================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de autenticacion');
      setUser(data);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // ============================================================================
  // HANDLERS: CRUD ACTIVOS IT
  // ============================================================================
  const openNewAssetModal = (preselectedEmp = null) => {
    setEditingAsset(null);
    setAssetForm({
      category: 'PC',
      TeamViewer: '',
      brand_model: '',
      department_id: preselectedEmp ? preselectedEmp.department_id : (departments[0]?.id || ''),
      employee_id: preselectedEmp ? preselectedEmp.id : '',
      connection_type: 'IP',
      ip_address: '',
      mac_address: '',
      hostname: '',
      status: 'Operativo',
      notes: ''
    });
    setIsAssetModalOpen(true);
  };

  const openEditAssetModal = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      category: asset.category,
      TeamViewer: asset.TeamViewer,
      brand_model: asset.brand_model,
      department_id: asset.department_id || '',
      employee_id: asset.employee_id || '',
      connection_type: asset.connection_type || 'IP',
      ip_address: asset.ip_address || '',
      mac_address: asset.mac_address || '',
      hostname: asset.hostname || '',
      status: asset.status,
      notes: asset.notes || ''
    });
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      const url = editingAsset ? `${API_URL}/assets/${editingAsset.id}` : `${API_URL}/assets`;
      const method = editingAsset ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el equipo');
      notify(editingAsset ? 'Equipo actualizado correctamente' : 'Nuevo equipo registrado en el inventario');
      setIsAssetModalOpen(false);
      fetchAllData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleReportFault = async (assetId) => {
    try {
      const res = await fetch(`${API_URL}/assets/${assetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Requiere Mantenimiento' })
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado');
      notify('Equipo marcado como: Requiere Mantenimiento', 'warning');
      fetchAllData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('¿Confirmas eliminar este activo permanentemente del inventario?')) return;
    await fetch(`${API_URL}/assets/${id}`, { method: 'DELETE' });
    notify('Equipo eliminado del registro');
    fetchAllData();
  };

  // ============================================================================
  // HANDLERS: DEPARTAMENTOS Y EMPLEADOS
  // ============================================================================
  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeptForm({ name: '', location: '' });
      notify(`Departamento "${data.name}" creado`);
      await fetchAllData();
      setSelectedDeptId(data.id);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('¿Eliminar este departamento y desvincular su personal?')) return;
    await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE' });
    notify('Departamento eliminado');
    fetchAllData();
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const targetDept = empForm.department_id || selectedDeptId;
    try {
      const res = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...empForm, department_id: targetDept })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmpForm({ full_name: '', email: '', position: '', department_id: '' });
      notify(`Empleado ${data.full_name} agregado al departamento`);
      fetchAllData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('¿Eliminar a esta persona de la nomina? Sus equipos quedaran sin asignar.')) return;
    await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
    notify('Empleado eliminado');
    fetchAllData();
  };

  // ============================================================================
  // HANDLERS: STOCK DEPOSITO
  // ============================================================================
  const handleCreateStock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockForm)
      });
      if (!res.ok) throw new Error('Error al registrar repuesto');
      setStockForm({ item_type: 'Disco SSD', brand_model: '', specs: '', quantity: 1, min_stock: 2, location: 'Armario A' });
      notify('Insumo/Repuesto agregado al Deposito IT');
      fetchAllData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleUpdateStockQty = async (id, delta) => {
    await fetch(`${API_URL}/stock/${id}/quantity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    });
    fetchAllData();
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm('¿Eliminar este item del stock de deposito?')) return;
    await fetch(`${API_URL}/stock/${id}`, { method: 'DELETE' });
    notify('Item eliminado del deposito');
    fetchAllData();
  };

  // ============================================================================
  // METRICAS Y FILTROS
  // ============================================================================
  const stats = useMemo(() => {
    const total = assets.length;
    const operativos = assets.filter(a => a.status === 'Operativo').length;
    const mantenimiento = assets.filter(a => a.status === 'Requiere Mantenimiento' || a.status === 'En Reparacion').length;
    const bajas = assets.filter(a => a.status === 'Dado de Baja').length;
    const lowStock = stock.filter(s => s.quantity <= s.min_stock).length;
    return { total, operativos, mantenimiento, bajas, lowStock };
  }, [assets, stock]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        (a.TeamViewer || '').toLowerCase().includes(term) ||
        (a.ip_address || '').toLowerCase().includes(term) ||
        (a.employee_name || '').toLowerCase().includes(term) ||
        (a.brand_model || '').toLowerCase().includes(term) ||
        (a.hostname || '').toLowerCase().includes(term);

      const matchStatus = statusFilter === 'Todos' || a.status === statusFilter;
      const matchCat = categoryFilter === 'Todas' || a.category === categoryFilter;
      const matchDept = deptFilter === 'Todos' || String(a.department_id) === String(deptFilter);

      return matchSearch && matchStatus && matchCat && matchDept;
    });
  }, [assets, searchTerm, statusFilter, categoryFilter, deptFilter]);

  const statusBadge = (status) => {
    const styles = {
      'Operativo': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'Requiere Mantenimiento': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'En Reparacion': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      'Dado de Baja': 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-700 text-slate-300'}`}>
        {status}
      </span>
    );
  };

  const categoryIcon = (cat) => {
    switch (cat) {
      case 'Notebook': return <Laptop className="w-4 h-4 text-blue-400" />;
      case 'PC': return <Monitor className="w-4 h-4 text-indigo-400" />;
      case 'Impresora': return <Printer className="w-4 h-4 text-purple-400" />;
      case 'Telefono IP': return <PhoneCall className="w-4 h-4 text-cyan-400" />;
      case 'Switch':
      case 'DVR/NVR': return <Server className="w-4 h-4 text-emerald-400" />;
      default: return <HardDrive className="w-4 h-4 text-slate-400" />;
    }
  };

  // ============================================================================
  // VISTA DE LOGIN
  // ============================================================================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl">
              <Server className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">IT Asset Manager Pro</h1>
              <p className="text-xs text-slate-400">Sistema de Inventario e Infraestructura IT</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Usuario Corporativo</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="admin o soporte"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="............"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              Iniciar Sesión en Consola IT
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-3 font-medium">Accesos rápidos de demostración (Seed):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoginForm({ username: 'admin', password: 'admin123' })}
                className="p-2.5 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 transition"
              >
                <div className="text-xs font-bold text-blue-400">Nivel 2: Admin IT</div>
                <div className="text-[11px] text-slate-400">user: admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => setLoginForm({ username: 'soporte', password: 'soporte123' })}
                className="p-2.5 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 transition"
              >
                <div className="text-xs font-bold text-emerald-400">Nivel 1: Soporte</div>
                <div className="text-[11px] text-slate-400">user: soporte / soporte123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculo para el grafico de dona (CSS Conic Gradient)
  const totalForChart = stats.total || 1;
  const pOp = Math.round((stats.operativos / totalForChart) * 100);
  const pMant = Math.round((stats.mantenimiento / totalForChart) * 100);
  const donutGradient = `conic-gradient(#10b981 0% ${pOp}%, #f59e0b ${pOp}% ${pOp + pMant}%, #f43f5e ${pOp + pMant}% 100%)`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* SIDEBAR CORPORATIVO */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">IT ASSET PRO</h2>
              <p className="text-[11px] text-slate-400">Infraestructura & Pañol</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard & Analiticas
            </button>

            <button
              onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'assets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" /> Inventario de Equipos
            </button>

            <button
              onClick={() => setActiveTab('organization')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'organization' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Departamentos y Personal
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'stock' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3"><Package className="w-4 h-4" /> Deposito / Stock IT</span>
              {stats.lowStock > 0 && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {stats.lowStock}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5 mb-3">
            <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-blue-400' : 'text-emerald-400'}`} />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-400">{isAdmin ? 'Permisos Totales (CRUD)' : 'Modo Lectura y Reporte'}</p>
            </div>
          </div>
          <button
            onClick={() => setUser(null)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 text-slate-300 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 overflow-y-auto">
        {notification && (
          <div className={`mb-5 p-3.5 rounded-xl border flex items-center justify-between text-sm ${
            notification.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : notification.type === 'warning'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">Cerrar</button>
          </div>
        )}

        {/* =====================================================================
            VISTA 1: DASHBOARD Y ANALITICAS
        ===================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard de Infraestructura IT</h1>
                <p className="text-sm text-slate-400">Resumen en tiempo real del parque informatico y estado operativo</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => openNewAssetModal()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Dar de Alta Equipo
                </button>
              )}
            </div>

            {/* 4 TARJETAS DE RESUMEN OBLIGATORIAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase">Total de Equipos</span>
                  <Monitor className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                <p className="text-xs text-slate-500 mt-1">Registrados en base de datos</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase">Equipos Operativos</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.operativos}</p>
                <p className="text-xs text-slate-500 mt-1">{pOp}% del parque activo</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase">En Mantenimiento / Falla</span>
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-amber-400 mt-2">{stats.mantenimiento}</p>
                <p className="text-xs text-slate-500 mt-1">Requieren atencion de Soporte</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase">Dados de Baja</span>
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-3xl font-bold text-rose-400 mt-2">{stats.bajas}</p>
                <p className="text-xs text-slate-500 mt-1">Desafectados de produccion</p>
              </div>
            </div>

            {/* 2 GRAFICOS INTERACTIVOS (ESTADO Y DEPARTAMENTO) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafico 1: Dona de Estado Operativo */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-1">Distribucion por Estado del Hardware</h3>
                <p className="text-xs text-slate-400 mb-6">Proporcion operativa del inventario actual</p>
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  <div
                    className="w-40 h-40 rounded-full flex items-center justify-center relative"
                    style={{ background: donutGradient }}
                  >
                    <div className="w-28 h-28 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{stats.total}</span>
                      <span className="text-[11px] text-slate-400">Activos</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-300">Operativos: <strong>{stats.operativos}</strong> ({pOp}%)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="text-slate-300">En Mantenimiento/Reparacion: <strong>{stats.mantenimiento}</strong> ({pMant}%)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="text-slate-300">Dados de Baja: <strong>{stats.bajas}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafico 2: Barras por Departamento */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-1">Equipos y Personal por Departamento</h3>
                <p className="text-xs text-slate-400 mb-5">Concentracion de hardware asignado en cada sector</p>
                <div className="space-y-4">
                  {departments.map(dept => {
                    const pct = stats.total > 0 ? Math.round((dept.asset_count / stats.total) * 100) : 0;
                    return (
                      <div key={dept.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-200">{dept.name}</span>
                          <span className="text-slate-400">{dept.asset_count} equipos - {dept.employee_count} personas ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VISTA 2: GESTION DE ACTIVOS IT (CRUD + BUSQUEDA DINAMICA)
        ===================================================================== */}
        {activeTab === 'assets' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Inventario General de Activos IT</h1>
                <p className="text-sm text-slate-400">PCs, Notebooks, Impresoras (IP/USB), Telefonos IP, Switches y CCTV</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => openNewAssetModal()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Registrar Equipo
                </button>
              )}
            </div>

            {/* BARRA DE BUSQUEDA DINAMICA Y FILTROS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar IP, N° Serie, Empleado, Hostname..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="Todas">Todas las Categorias</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="Todos">Todos los Departamentos</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="Todos">Todos los Estados</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* TABLA DE ACTIVOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 bg-slate-950/60">
                      <th className="py-3.5 px-4">Equipo / Marca</th>
                      <th className="py-3.5 px-4">TeamViewer</th>
                      <th className="py-3.5 px-4">Departamento / Asignado a</th>
                      <th className="py-3.5 px-4">Red / IP / Detalles Notebook</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-sm">
                    {filteredAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {categoryIcon(asset.category)}
                            <div>
                              <div className="font-medium text-white">{asset.brand_model}</div>
                              <div className="text-xs text-slate-400">{asset.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{asset.TeamViewer}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium">{asset.employee_name || 'Uso Departamental / Libre'}</div>
                          <div className="text-xs text-slate-400">{asset.department_name || 'Sin departamento'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {asset.connection_type === 'USB' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                              <Usb className="w-3 h-3" /> Conexion USB Local
                            </span>
                          ) : asset.ip_address ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                                <Network className="w-3 h-3" /> {asset.ip_address}
                              </span>
                              {asset.category === 'Notebook' && (asset.hostname || asset.mac_address) && (
                                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                                  {asset.hostname && <span>Host: {asset.hostname} </span>}
                                  {asset.mac_address && <span>| MAC: {asset.mac_address}</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Sin IP asignada</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{statusBadge(asset.status)}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {/* Accion para Operador Nivel 1 y Admin: Reportar falla rapida */}
                          {asset.status === 'Operativo' && (
                            <button
                              onClick={() => handleReportFault(asset.id)}
                              title="Marcar equipo con falla (Requiere Mantenimiento)"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs transition"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Reportar Falla
                            </button>
                          )}
                          {/* Acciones exclusivas Administrador Nivel 2 */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditAssetModal(asset)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 transition"
                                title="Editar / Reasignar Equipo"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 transition"
                                title="Eliminar Registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredAssets.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                          No se encontraron equipos con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VISTA 3: DEPARTAMENTOS Y PERSONAL (JERARQUIA ORGANIZACIONAL)
        ===================================================================== */}
        {activeTab === 'organization' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Estructura Organizacional: Departamentos y Personal</h1>
              <p className="text-sm text-slate-400">
                Crea departamentos, da de alta a las personas que trabajan en cada sector y asignales sus equipos IT.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COLUMNA IZQUIERDA: DEPARTAMENTOS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" /> 1. Departamentos de la Empresa
                </h3>

                {isAdmin && (
                  <form onSubmit={handleCreateDept} className="space-y-2.5 pb-4 border-b border-slate-800">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del Departamento (Ej: Contaduria)"
                      value={deptForm.name}
                      onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ubicacion / Piso"
                        value={deptForm.location}
                        onChange={e => setDeptForm({ ...deptForm, location: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium">
                        + Agregar
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {departments.map(dept => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedDeptId === dept.id
                          ? 'bg-blue-600/15 border-blue-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{dept.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {dept.location || 'Sin ubicacion'} - {dept.employee_count} personas - {dept.asset_count} equipos
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }}
                            className="p-1.5 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA DERECHA (2/3): EMPLEADOS DEL DEPARTAMENTO SELECCIONADO Y SUS EQUIPOS */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                {selectedDeptId ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          2. Personal en: {departments.find(d => d.id === selectedDeptId)?.name}
                        </h3>
                        <p className="text-xs text-slate-400">Gestiona los empleados del sector y asignales PC, Notebook, Telefono IP o Impresora</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                        <input
                          type="text"
                          required
                          placeholder="Nombre y Apellido *"
                          value={empForm.full_name}
                          onChange={e => setEmpForm({ ...empForm, full_name: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Cargo / Puesto (Ej: Analista)"
                          value={empForm.position}
                          onChange={e => setEmpForm({ ...empForm, position: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="email"
                          placeholder="Correo corporativo"
                          value={empForm.email}
                          onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 text-xs font-medium">
                          + Agregar Persona
                        </button>
                      </form>
                    )}

                    {/* Listado de Empleados y sus Equipos Asignados */}
                    <div className="space-y-3">
                      {employees.filter(e => e.department_id === selectedDeptId).map(emp => {
                        const empAssets = assets.filter(a => a.employee_id === emp.id);
                        return (
                          <div key={emp.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold text-white text-sm">{emp.full_name}</span>
                                <span className="ml-2 text-xs text-slate-400">({emp.position || 'Sin cargo especificado'})</span>
                                {emp.email && <div className="text-xs text-slate-500">{emp.email}</div>}
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openNewAssetModal(emp)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Asignar Equipo a {emp.full_name.split(' ')[0]}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400"
                                    title="Eliminar Empleado"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Equipos asignados a esta persona */}
                            {empAssets.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                                {empAssets.map(a => (
                                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                                    <div className="flex items-center gap-2">
                                      {categoryIcon(a.category)}
                                      <div>
                                        <div className="font-medium text-slate-200">{a.category}: {a.brand_model}</div>
                                        <div className="text-[11px] text-slate-400 font-mono">
                                          TeamViewer: {a.TeamViewer} {a.ip_address ? `| IP: ${a.ip_address}` : '| USB/Local'}
                                          {a.hostname ? ` | Host: ${a.hostname}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                    {statusBadge(a.status)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic">Sin equipamiento asignado actualmente.</p>
                            )}
                          </div>
                        );
                      })}

                      {/* Impresoras o Equipos de Red asignados al Departamento en general */}
                      <div className="pt-3 border-t border-slate-800">
                        <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">
                          Equipos de Uso Compartido del Departamento (Impresoras de Red, Switches, etc.)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {assets.filter(a => a.department_id === selectedDeptId && !a.employee_id).map(a => (
                            <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              <div className="flex items-center gap-2">
                                {categoryIcon(a.category)}
                                <div>
                                  <div className="font-medium text-white">{a.category}: {a.brand_model}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    TeamViewer: {a.TeamViewer} {a.ip_address ? `| IP: ${a.ip_address}` : ''}
                                  </div>
                                </div>
                              </div>
                              {statusBadge(a.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Selecciona un departamento a la izquierda.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VISTA 4: DEPOSITO / PANOL DE STOCK IT (RAM, SSD, HDD, FUENTES)
        ===================================================================== */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Control de Stock en Deposito / PaÃ±ol IT</h1>
              <p className="text-sm text-slate-400">
                Gestion de repuestos e insumos en deposito (Discos SSD/HDD, Memorias RAM, Fuentes ATX, Switches de backup)
              </p>
            </div>

            {isAdmin && (
              <form onSubmit={handleCreateStock} className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-3">
                <select
                  value={stockForm.item_type}
                  onChange={e => setStockForm({ ...stockForm, item_type: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {STOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Marca y Modelo (Ej: Kingston NV2)"
                  value={stockForm.brand_model}
                  onChange={e => setStockForm({ ...stockForm, brand_model: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Capacidad/Specs (Ej: 500GB NVMe)"
                  value={stockForm.specs}
                  onChange={e => setStockForm({ ...stockForm, specs: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Cantidad"
                  value={stockForm.quantity}
                  onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Ubicacion en Deposito"
                  value={stockForm.location}
                  onChange={e => setStockForm({ ...stockForm, location: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-xs font-medium">
                  + Agregar al Stock
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stock.map(item => {
                const isLow = item.quantity <= item.min_stock;
                return (
                  <div key={item.id} className={`p-5 rounded-xl bg-slate-900 border ${isLow ? 'border-amber-500/50' : 'border-slate-800'} flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" /> {item.item_type}
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Stock Critico (Min: {item.min_stock})
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-base">{item.brand_model}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.specs}</p>
                      <p className="text-[11px] text-slate-500 mt-2">Ubicacion: {item.location}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Disponibles: </span>
                        <span className={`text-xl font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>{item.quantity} u.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStockQty(item.id, -1)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                          title="Descontar 1 unidad usada en soporte"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleUpdateStockQty(item.id, 1)}
                          className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-bold"
                          title="Sumar 1 unidad al stock"
                        >
                          +1
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteStock(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL ALTA / EDICION DE EQUIPO (CON REGLAS DE NOTEBOOK E IMPRESORA)
        ===================================================================== */}
        {isAssetModalOpen && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">
                  {editingAsset ? 'Editar / Reasignar Equipo IT' : 'Registrar Nuevo Activo IT'}
                </h3>
                <button onClick={() => setIsAssetModalOpen(false)} className="text-slate-400 hover:text-white text-sm">•</button>
              </div>

              <form onSubmit={handleSaveAsset} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoria de Hardware *</label>
                  <select
                    value={assetForm.category}
                    onChange={e => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">TeamViewer (Unico) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: SN-DELL-99102"
                    value={assetForm.TeamViewer}
                    onChange={e => setAssetForm({ ...assetForm, TeamViewer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Marca y Modelo / Especificaciones *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lenovo ThinkPad T14 i5 16GB RAM / HP LaserJet Pro"
                    value={assetForm.brand_model}
                    onChange={e => setAssetForm({ ...assetForm, brand_model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Departamento Asignado</label>
                  <select
                    value={assetForm.department_id}
                    onChange={e => setAssetForm({ ...assetForm, department_id: e.target.value, employee_id: '' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">-- Sin Departamento --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Persona / Empleado Asignado</label>
                  <select
                    value={assetForm.employee_id}
                    onChange={e => setAssetForm({ ...assetForm, employee_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">-- Uso Compartido / Sin Empleado --</option>
                    {employees
                      .filter(emp => !assetForm.department_id || String(emp.department_id) === String(assetForm.department_id))
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo de Conexion</label>
                  <select
                    value={assetForm.connection_type}
                    onChange={e => setAssetForm({ ...assetForm, connection_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="IP">Red IP (LAN / Wi-Fi)</option>
                    <option value="USB">Cable USB Directo (Ej: Impresora Local)</option>
                    <option value="Sin Red">Sin Conexion de Red (Ej: Monitor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Direccion IPv4 (Unica en la Red)</label>
                  <input
                    type="text"
                    disabled={assetForm.connection_type !== 'IP'}
                    placeholder={assetForm.connection_type === 'IP' ? 'Ej: 192.168.1.55' : 'No aplica (USB / Sin Red)'}
                    value={assetForm.connection_type === 'IP' ? assetForm.ip_address : ''}
                    onChange={e => setAssetForm({ ...assetForm, ip_address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono disabled:opacity-40"
                  />
                </div>

                {/* CAMPOS EXCLUSIVOS PARA NOTEBOOKS (SOLICITADO POR EL USUARIO) */}
                {assetForm.category === 'Notebook' && (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 text-xs font-semibold text-blue-300">
                      Parametros Exclusivos de Red para Notebooks:
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Hostname del Equipo</label>
                      <input
                        type="text"
                        placeholder="Ej: NB-SIS-01"
                        value={assetForm.hostname}
                        onChange={e => setAssetForm({ ...assetForm, hostname: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Direccion MAC (Wi-Fi / Ethernet)</label>
                      <input
                        type="text"
                        placeholder="Ej: 00:1B:44:11:3A:B7"
                        value={assetForm.mac_address}
                        onChange={e => setAssetForm({ ...assetForm, mac_address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Estado Operativo *</label>
                  <select
                    value={assetForm.status}
                    onChange={e => setAssetForm({ ...assetForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Observaciones / Notas Tecnicas</label>
                  <input
                    type="text"
                    placeholder="Detalles de garantia, perifericos..."
                    value={assetForm.notes}
                    onChange={e => setAssetForm({ ...assetForm, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAssetModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    {editingAsset ? 'Guardar Cambios' : 'Registrar Activo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
