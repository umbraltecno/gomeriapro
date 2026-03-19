import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Calendar, 
  Users, 
  Truck, 
  BarChart3,
  Search,
  Plus,
  AlertTriangle,
  TrendingUp,
  Wrench,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  DollarSign,
  FileText,
  Banknote,
  History,
  ArrowUpCircle,
  Edit,
  Trash2,
  Eye,
  Printer,
  Receipt,
  ArrowDownCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Product, Service, Customer, Vehicle, Appointment, DashboardStats, WorkOrder, Supplier, Purchase, Check } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void, key?: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg",
      active 
        ? "bg-zinc-900 text-white" 
        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
    )}
  >
    <Icon size={20} />
    {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, color }: { label: string, value: string | number, icon: any, trend?: string, color: string }) => (
  <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-sm font-medium text-zinc-500">{label}</h3>
    <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
  </div>
);

// --- Modules ---

const Dashboard = ({ stats }: { stats: DashboardStats | null }) => {
  const data = [
    { name: 'Lun', sales: 4000 },
    { name: 'Mar', sales: 3000 },
    { name: 'Mie', sales: 2000 },
    { name: 'Jue', sales: 2780 },
    { name: 'Vie', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Dom', sales: 3490 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Ventas del Día" 
          value={`$${stats?.salesToday.toLocaleString() || 0}`} 
          icon={DollarSign} 
          trend="+12%" 
          color="bg-emerald-500"
        />
        <StatCard 
          label="Servicios Realizados" 
          value={stats?.servicesToday || 0} 
          icon={Wrench} 
          trend="+5%" 
          color="bg-blue-500"
        />
        <StatCard 
          label="Stock Crítico" 
          value={stats?.criticalStock || 0} 
          icon={AlertTriangle} 
          color="bg-amber-500"
        />
        <StatCard 
          label="Turnos Pendientes" 
          value={stats?.pendingAppointments || 0} 
          icon={Calendar} 
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Ventas Semanales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Próximos Turnos</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                    JD
                  </div>
                  <div>
                    <p className="text-sm font-medium">Juan Doe</p>
                    <p className="text-xs text-zinc-500">Alineación y Balanceo • 14:30</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  En espera
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMassiveUpdate, setShowMassiveUpdate] = useState(false);
  const [massiveUpdate, setMassiveUpdate] = useState({ percentage: 0, type: '', brand: '' });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    brand: '', model: '', rim: '', width: '', profile: '', type: 'auto', price: 0, stock: 0, min_stock: 5, sku: ''
  });

  const fetchProducts = () => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleMassiveUpdate = async () => {
    const response = await fetch('/api/products/massive-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(massiveUpdate)
    });
    if (response.ok) {
      const data = await response.json();
      alert(`Se actualizaron ${data.updated} productos.`);
      setShowMassiveUpdate(false);
      fetchProducts();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productForm)
    });

    if (response.ok) {
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ brand: '', model: '', rim: '', width: '', profile: '', type: 'auto', price: 0, stock: 0, min_stock: 5, sku: '' });
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchProducts();
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm(product);
    setShowProductModal(true);
  };

  const filteredProducts = products.filter(p => 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por marca, modelo o SKU..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowMassiveUpdate(true)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors"
          >
            <ArrowUpCircle size={18} />
            Aumento Masivo
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ brand: '', model: '', rim: '', width: '', profile: '', type: 'auto', price: 0, stock: 0, min_stock: 5, sku: '' });
              setShowProductModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {showMassiveUpdate && (
        <div className="p-6 bg-zinc-900 text-white rounded-xl shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold">Aumento de Precios Masivo</h4>
            <button onClick={() => setShowMassiveUpdate(false)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Porcentaje (%)</label>
              <input 
                type="number" 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                value={massiveUpdate.percentage}
                onChange={(e) => setMassiveUpdate({...massiveUpdate, percentage: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Tipo (Opcional)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="Ej: auto"
                value={massiveUpdate.type}
                onChange={(e) => setMassiveUpdate({...massiveUpdate, type: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Marca (Opcional)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="Ej: Pirelli"
                value={massiveUpdate.brand}
                onChange={(e) => setMassiveUpdate({...massiveUpdate, brand: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={handleMassiveUpdate}
            className="w-full py-2 bg-white text-zinc-900 rounded-lg font-bold hover:bg-zinc-100 transition-colors"
          >
            Aplicar Aumento
          </button>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Marca</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Modelo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    value={productForm.model}
                    onChange={(e) => setProductForm({...productForm, model: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Ancho</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                      value={productForm.width}
                      onChange={(e) => setProductForm({...productForm, width: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Perfil</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                      value={productForm.profile}
                      onChange={(e) => setProductForm({...productForm, profile: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Rodado</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                      value={productForm.rim}
                      onChange={(e) => setProductForm({...productForm, rim: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Tipo</label>
                  <select 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    value={productForm.type}
                    onChange={(e) => setProductForm({...productForm, type: e.target.value})}
                  >
                    <option value="auto">Auto</option>
                    <option value="camioneta">Camioneta</option>
                    <option value="utilitario">Utilitario</option>
                    <option value="moto">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Precio</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">SKU</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Stock</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Stock Mín.</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                      value={productForm.min_stock}
                      onChange={(e) => setProductForm({...productForm, min_stock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">SKU</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Producto</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Medida</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Tipo</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Precio</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Stock</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">{p.sku}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-zinc-900">{p.brand} {p.model}</p>
                </td>
                <td className="px-6 py-4 text-zinc-600">{p.width}/{p.profile} R{p.rim}</td>
                <td className="px-6 py-4">
                  <span className="capitalize text-xs bg-zinc-100 px-2 py-1 rounded-md">{p.type}</span>
                </td>
                <td className="px-6 py-4 font-medium">${p.price.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      p.stock <= p.min_stock ? "bg-red-500" : "bg-emerald-500"
                    )} />
                    <span className={p.stock <= p.min_stock ? "text-red-600 font-medium" : "text-zinc-600"}>
                      {p.stock} unidades
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(p)}
                      className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const POS = () => {
  const [cart, setCart] = useState<{id: number, name: string, price: number, quantity: number, type: 'product' | 'service'}[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkData, setCheckData] = useState({ bank: '', number: '', due_date: '' });

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/services').then(res => res.json()),
      fetch('/api/customers').then(res => res.json())
    ]).then(([p, s, c]) => {
      setProducts(p);
      setServices(s);
      setCustomers(c);
    });
  }, []);

  const addToCart = (item: any, type: 'product' | 'service') => {
    const existing = cart.find(c => c.id === item.id && c.type === type);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && c.type === type ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { 
        id: item.id, 
        name: type === 'product' ? `${item.brand} ${item.model}` : item.name, 
        price: item.price, 
        quantity: 1,
        type 
      }]);
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (paymentMethod === 'Check' && (!checkData.bank || !checkData.number || !checkData.due_date)) {
      alert('Por favor complete los datos del cheque');
      setShowCheckModal(true);
      return;
    }

    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: selectedCustomer?.id || null,
        items: cart.map(c => ({
          product_id: c.type === 'product' ? c.id : null,
          service_id: c.type === 'service' ? c.id : null,
          quantity: c.quantity,
          price: c.price
        })),
        total,
        payment_method: paymentMethod,
        payment_details: paymentMethod === 'Check' ? { check: { ...checkData, amount: total } } : null,
        status: 'completed'
      })
    });
    if (response.ok) {
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('Efectivo');
      setCheckData({ bank: '', number: '', due_date: '' });
      alert('Venta realizada con éxito');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {showCheckModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Datos del Cheque</h3>
            <div className="space-y-3">
              <input 
                type="text" placeholder="Banco" 
                className="w-full p-2 border border-zinc-200 rounded-lg"
                value={checkData.bank}
                onChange={e => setCheckData({...checkData, bank: e.target.value})}
              />
              <input 
                type="text" placeholder="Número de Cheque" 
                className="w-full p-2 border border-zinc-200 rounded-lg"
                value={checkData.number}
                onChange={e => setCheckData({...checkData, number: e.target.value})}
              />
              <input 
                type="date" 
                className="w-full p-2 border border-zinc-200 rounded-lg"
                value={checkData.due_date}
                onChange={e => setCheckData({...checkData, due_date: e.target.value})}
              />
            </div>
            <button 
              onClick={() => setShowCheckModal(false)}
              className="w-full py-2 bg-zinc-900 text-white rounded-lg font-bold"
            >
              Confirmar Cheque
            </button>
          </div>
        </div>
      )}

      <div className="lg:col-span-2 space-y-4 flex flex-col">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar productos o servicios..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none"
            onChange={(e) => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)) || null)}
            value={selectedCustomer?.id || ''}
          >
            <option value="">Cliente Final</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Servicios</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(s => (
                <button 
                  key={s.id}
                  onClick={() => addToCart(s, 'service')}
                  className="p-4 bg-white border border-zinc-200 rounded-xl text-left hover:border-zinc-900 transition-all group"
                >
                  <Wrench size={20} className="text-zinc-400 group-hover:text-zinc-900 mb-2" />
                  <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">${s.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Neumáticos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.filter(p => p.brand.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p, 'product')}
                  className="p-4 bg-white border border-zinc-200 rounded-xl text-left hover:border-zinc-900 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Package size={20} className="text-zinc-400 group-hover:text-zinc-900" />
                    <span className="text-[10px] font-bold bg-zinc-100 px-1.5 py-0.5 rounded uppercase">{p.rim}"</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 truncate">{p.brand} {p.model}</p>
                  <p className="text-xs text-zinc-500 mt-1">${p.price.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Stock: {p.stock}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <h3 className="font-semibold flex items-center gap-2">
            <ShoppingCart size={18} />
            Carrito de Venta
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.type}-${item.id}`} className="flex justify-between items-center">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.quantity} x ${item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                    className="text-zinc-300 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                  <p className="text-sm font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Forma de Pago</label>
            <select 
              className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-sm"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                if (e.target.value === 'Check') setShowCheckModal(true);
              }}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Current Account">Cuenta Corriente</option>
              <option value="Check">Cheque</option>
            </select>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-white transition-colors">
              Presupuesto
            </button>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cobrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Appointments = ({ onCreateOT }: { onCreateOT: (appointment: Appointment) => void }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<Partial<Appointment>>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    customer_id: 0,
    vehicle_id: 0,
    service_id: 0,
    notes: '',
    status: 'pending'
  });

  const fetchData = () => {
    Promise.all([
      fetch('/api/appointments').then(res => res.json()),
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/vehicles').then(res => res.json()),
      fetch('/api/services').then(res => res.json())
    ]).then(([a, c, v, s]) => {
      setAppointments(a);
      setCustomers(c);
      setVehicles(v);
      setServices(s);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingAppointment ? 'PUT' : 'POST';
    const url = editingAppointment ? `/api/appointments/${editingAppointment.id}` : '/api/appointments';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setShowModal(false);
      setEditingAppointment(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        customer_id: 0,
        vehicle_id: 0,
        service_id: 0,
        notes: '',
        status: 'pending'
      });
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este turno?')) {
      const response = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (response.ok) fetchData();
    }
  };

  const openEdit = (a: Appointment) => {
    setEditingAppointment(a);
    setForm(a);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agenda de Turnos</h3>
        <button 
          onClick={() => {
            setEditingAppointment(null);
            setForm({
              date: new Date().toISOString().split('T')[0],
              time: '09:00',
              customer_id: customers[0]?.id || 0,
              vehicle_id: vehicles[0]?.id || 0,
              service_id: services[0]?.id || 0,
              notes: '',
              status: 'pending'
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          Nuevo Turno
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">{editingAppointment ? 'Editar Turno' : 'Nuevo Turno'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Fecha</label>
                  <input 
                    type="date" required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none"
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Hora</label>
                  <input 
                    type="time" required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none"
                    value={form.time}
                    onChange={e => setForm({...form, time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Cliente</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none"
                  value={form.customer_id}
                  onChange={e => setForm({...form, customer_id: parseInt(e.target.value)})}
                >
                  <option value="">Seleccionar Cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Vehículo</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none"
                  value={form.vehicle_id}
                  onChange={e => setForm({...form, vehicle_id: parseInt(e.target.value)})}
                >
                  <option value="">Seleccionar Vehículo</option>
                  {vehicles.filter(v => v.customer_id === form.customer_id).map(v => (
                    <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Servicio</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none"
                  value={form.service_id}
                  onChange={e => setForm({...form, service_id: parseInt(e.target.value)})}
                >
                  <option value="">Seleccionar Servicio</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Estado</label>
                <select 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value as any})}
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Notas</label>
                <textarea 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none h-20"
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  {editingAppointment ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map(a => (
          <div key={a.id} className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-zinc-900">{a.customer_name || 'Cliente Final'}</p>
                <p className="text-xs text-zinc-500">{a.license_plate || 'Sin Patente'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                  a.status === 'pending' ? "bg-blue-50 text-blue-600" :
                  a.status === 'in_progress' ? "bg-amber-50 text-amber-600" :
                  "bg-emerald-50 text-emerald-600"
                )}>
                  {a.status === 'pending' ? 'Pendiente' : a.status === 'in_progress' ? 'En Proceso' : 'Terminado'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1 text-zinc-400 hover:text-blue-600"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1 text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {a.date}
              </div>
              <div className="flex items-center gap-1">
                <Search size={14} className="rotate-90" />
                {a.time}
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-900">{a.service_name}</p>
              {a.status === 'pending' && (
                <button 
                  onClick={() => onCreateOT(a)}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded-md transition-colors"
                >
                  <FileText size={14} />
                  Crear OT
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkOrders = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchOrders = () => {
    fetch('/api/work-orders').then(res => res.json()).then(setOrders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewDetails = async (id: number) => {
    const res = await fetch(`/api/work-orders/${id}`);
    const data = await res.json();
    setSelectedOrder(data);
    setShowDetails(true);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/work-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchOrders();
      setShowDetails(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta Orden de Trabajo?')) {
      const res = await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOrders();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Órdenes de Trabajo (OT)</h3>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">ID</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Fecha</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Cliente</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Vehículo</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Total</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Estado</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">#{o.id}</td>
                <td className="px-6 py-4 text-zinc-600">{new Date(o.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-zinc-900">{o.customer_name || 'Cliente Final'}</p>
                </td>
                <td className="px-6 py-4 text-zinc-600">{o.license_plate}</td>
                <td className="px-6 py-4 font-medium">${o.total.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    o.status === 'open' ? "bg-blue-50 text-blue-600" : "bg-zinc-50 text-zinc-600"
                  )}>
                    {o.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleViewDetails(o.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(o.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">Orden de Trabajo #{selectedOrder.id}</h3>
                <p className="text-xs text-zinc-500">{new Date(selectedOrder.date).toLocaleString()}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cliente</h4>
                  <p className="font-semibold text-zinc-900">{selectedOrder.customers?.name}</p>
                  <p className="text-sm text-zinc-500">{selectedOrder.customers?.phone}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vehículo</h4>
                  <p className="font-semibold text-zinc-900">{selectedOrder.vehicles?.brand} {selectedOrder.vehicles?.model}</p>
                  <p className="text-sm font-mono text-zinc-500">{selectedOrder.vehicles?.license_plate}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Items del Servicio</h4>
                <div className="border border-zinc-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-zinc-600">Descripción</th>
                        <th className="px-4 py-2 text-center font-semibold text-zinc-600">Cant.</th>
                        <th className="px-4 py-2 text-right font-semibold text-zinc-600">Precio</th>
                        <th className="px-4 py-2 text-right font-semibold text-zinc-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {selectedOrder.work_order_items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            {item.services?.name || `${item.products?.brand} ${item.products?.model}`}
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium">${(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50/50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">TOTAL</td>
                        <td className="px-4 py-3 text-right text-lg">${selectedOrder.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Notas / Observaciones</h4>
                  <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 italic">
                    "{selectedOrder.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  onClick={() => window.print()}
                >
                  <Printer size={18} />
                  Imprimir
                </button>
              </div>
              <div className="flex gap-2">
                {selectedOrder.status === 'open' ? (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'closed')}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Cerrar Orden
                  </button>
                ) : (
                  <span className="text-zinc-400 font-bold text-sm uppercase px-4 py-2">Orden Cerrada</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({
    name: '', phone: '', email: '', address: '', balance: 0
  });

  const fetchCustomers = () => {
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCustomer ? 'PUT' : 'POST';
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setShowModal(false);
      setEditingCustomer(null);
      setForm({ name: '', phone: '', email: '', address: '', balance: 0 });
      fetchCustomers();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (response.ok) fetchCustomers();
    }
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm(c);
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setForm({ name: '', phone: '', email: '', address: '', balance: 0 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Teléfono</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Dirección</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Saldo Inicial (CC)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.balance}
                  onChange={(e) => setForm({...form, balance: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">Nombre</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Teléfono</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Email</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Saldo CC</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">{c.name}</td>
                <td className="px-6 py-4 text-zinc-600">{c.phone}</td>
                <td className="px-6 py-4 text-zinc-600">{c.email}</td>
                <td className={cn(
                  "px-6 py-4 font-bold",
                  c.balance > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ${c.balance.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEdit(c)}
                      className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CuentaCorriente = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'Cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchCustomers = () => {
    fetch('/api/customers').then(res => res.json()).then(data => {
      setCustomers(data.filter((c: Customer) => c.balance !== 0));
    });
  };

  const fetchTransactions = (customerId: number) => {
    fetch(`/api/customers/${customerId}/transactions`)
      .then(res => res.json())
      .then(setTransactions);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchTransactions(customer.id);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const response = await fetch('/api/customer-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: selectedCustomer.id,
        ...paymentForm
      })
    });

    if (response.ok) {
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, payment_method: 'Cash', notes: '', date: new Date().toISOString().split('T')[0] });
      fetchTransactions(selectedCustomer.id);
      fetchCustomers();
      // Update selected customer balance locally
      setSelectedCustomer({
        ...selectedCustomer,
        balance: selectedCustomer.balance - paymentForm.amount
      });
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm max-h-[calc(100vh-250px)] overflow-y-auto">
          <div className="divide-y divide-zinc-100">
            {filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => handleViewDetails(c)}
                className={cn(
                  "w-full p-4 text-left hover:bg-zinc-50 transition-colors flex justify-between items-center",
                  selectedCustomer?.id === c.id && "bg-zinc-50 border-r-2 border-zinc-900"
                )}
              >
                <div>
                  <p className="font-semibold text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.phone}</p>
                </div>
                <p className={cn(
                  "font-bold",
                  c.balance > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ${c.balance.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="lg:col-span-2">
        {selectedCustomer ? (
          <div className="space-y-4">
            <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-zinc-500">Estado de Cuenta Corriente</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Saldo Pendiente</p>
                <p className={cn(
                  "text-2xl font-black",
                  selectedCustomer.balance > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ${selectedCustomer.balance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <DollarSign size={18} />
                Registrar Pago
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                <Printer size={18} />
                Imprimir Resumen
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-bottom border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-zinc-900">Fecha</th>
                    <th className="px-6 py-4 font-semibold text-zinc-900">Descripción</th>
                    <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Debe</th>
                    <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-zinc-600">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900">{t.description}</td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">
                        {t.type === 'debit' ? `$${t.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                        {t.type === 'credit' ? `$${t.amount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-12">
            <History size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Selecciona un cliente para ver su estado de cuenta</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">Registrar Pago</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Monto del Pago</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Método de Pago</label>
                <select 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                >
                  <option value="Cash">Efectivo</option>
                  <option value="Transfer">Transferencia</option>
                  <option value="Debit">Débito</option>
                  <option value="Credit">Crédito</option>
                  <option value="Check">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Fecha</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Notas / Referencia</label>
                <textarea 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 h-24 resize-none"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Ej: Recibo #1234, Transferencia Banco..."
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Partial<Vehicle>>({
    license_plate: '', brand: '', model: '', year: new Date().getFullYear(), customer_id: 0
  });

  const fetchVehicles = () => {
    fetch('/api/vehicles').then(res => res.json()).then(setVehicles);
  };

  const fetchCustomers = () => {
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
  };

  useEffect(() => {
    fetchVehicles();
    fetchCustomers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingVehicle ? 'PUT' : 'POST';
    const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setShowModal(false);
      setEditingVehicle(null);
      setForm({ license_plate: '', brand: '', model: '', year: new Date().getFullYear(), customer_id: 0 });
      fetchVehicles();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (response.ok) fetchVehicles();
    }
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm(v);
    setShowModal(true);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por patente, marca o dueño..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingVehicle(null);
            setForm({ license_plate: '', brand: '', model: '', year: new Date().getFullYear(), customer_id: 0 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          Nuevo Vehículo
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Patente</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 font-mono uppercase"
                  value={form.license_plate}
                  onChange={(e) => setForm({...form, license_plate: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Marca</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={form.brand}
                    onChange={(e) => setForm({...form, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Modelo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={form.model}
                    onChange={(e) => setForm({...form, model: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Año</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.year}
                  onChange={(e) => setForm({...form, year: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Dueño (Cliente)</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.customer_id}
                  onChange={(e) => setForm({...form, customer_id: parseInt(e.target.value)})}
                >
                  <option value="">Seleccionar Cliente</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  {editingVehicle ? 'Guardar Cambios' : 'Crear Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">Patente</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Marca/Modelo</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Año</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Dueño</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredVehicles.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-zinc-900">{v.license_plate}</td>
                <td className="px-6 py-4 text-zinc-600">{v.brand} {v.model}</td>
                <td className="px-6 py-4 text-zinc-600">{v.year}</td>
                <td className="px-6 py-4 text-zinc-900 font-medium">{v.owner_name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEdit(v)}
                      className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(v.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>({
    name: '', contact: '', phone: '', address: '', balance: 0
  });

  const fetchSuppliers = () => {
    fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSupplier ? 'PUT' : 'POST';
    const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setShowModal(false);
      setEditingSupplier(null);
      setForm({ name: '', contact: '', phone: '', address: '', balance: 0 });
      fetchSuppliers();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (response.ok) fetchSuppliers();
    }
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm(s);
    setShowModal(true);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, contacto o teléfono..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingSupplier(null);
            setForm({ name: '', contact: '', phone: '', address: '', balance: 0 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Nombre de la Empresa</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Persona de Contacto</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={form.contact}
                    onChange={(e) => setForm({...form, contact: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Teléfono</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Dirección</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Saldo Inicial (CC)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={form.balance}
                  onChange={(e) => setForm({...form, balance: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  {editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">Nombre</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Contacto</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Teléfono</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Saldo CC</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredSuppliers.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">{s.name}</td>
                <td className="px-6 py-4 text-zinc-600">{s.contact}</td>
                <td className="px-6 py-4 text-zinc-600">{s.phone}</td>
                <td className={cn(
                  "px-6 py-4 font-bold",
                  s.balance > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ${s.balance.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEdit(s)}
                      className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CuentaCorrienteProveedores = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'Cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchSuppliers = () => {
    fetch('/api/suppliers').then(res => res.json()).then(data => {
      setSuppliers(data.filter((s: Supplier) => s.balance !== 0));
    });
  };

  const fetchTransactions = (supplierId: number) => {
    fetch(`/api/suppliers/${supplierId}/transactions`)
      .then(res => res.json())
      .then(setTransactions);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    fetchTransactions(supplier.id);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const response = await fetch('/api/supplier-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier_id: selectedSupplier.id,
        ...paymentForm
      })
    });

    if (response.ok) {
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, payment_method: 'Cash', notes: '', date: new Date().toISOString().split('T')[0] });
      fetchTransactions(selectedSupplier.id);
      fetchSuppliers();
      // Update selected supplier balance locally
      setSelectedSupplier({
        ...selectedSupplier,
        balance: selectedSupplier.balance - paymentForm.amount
      });
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Supplier List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar proveedor..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm max-h-[calc(100vh-250px)] overflow-y-auto">
          <div className="divide-y divide-zinc-100">
            {filteredSuppliers.map(s => (
              <button
                key={s.id}
                onClick={() => handleViewDetails(s)}
                className={cn(
                  "w-full p-4 text-left hover:bg-zinc-50 transition-colors flex justify-between items-center",
                  selectedSupplier?.id === s.id && "bg-zinc-50 border-r-2 border-zinc-900"
                )}
              >
                <div>
                  <p className="font-semibold text-zinc-900">{s.name}</p>
                  <p className="text-xs text-zinc-500">{s.contact}</p>
                </div>
                <p className={cn(
                  "font-bold",
                  s.balance > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ${s.balance.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="lg:col-span-2">
        {selectedSupplier ? (
          <div className="space-y-4">
            <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{selectedSupplier.name}</h3>
                <p className="text-sm text-zinc-500">Estado de Cuenta Corriente Proveedor</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Saldo Adeudado</p>
                <p className={cn(
                  "text-2xl font-black",
                  selectedSupplier.balance > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ${selectedSupplier.balance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <DollarSign size={18} />
                Registrar Pago
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                <Printer size={18} />
                Imprimir Resumen
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-bottom border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-zinc-900">Fecha</th>
                    <th className="px-6 py-4 font-semibold text-zinc-900">Descripción</th>
                    <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Debe (Compra)</th>
                    <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Haber (Pago)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-zinc-600">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900">{t.description}</td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">
                        {t.type === 'debit' ? `$${t.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                        {t.type === 'credit' ? `$${t.amount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-12">
            <History size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Selecciona un proveedor para ver su estado de cuenta</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">Registrar Pago a Proveedor</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Monto del Pago</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Método de Pago</label>
                <select 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                >
                  <option value="Cash">Efectivo</option>
                  <option value="Transfer">Transferencia</option>
                  <option value="Debit">Débito</option>
                  <option value="Credit">Crédito</option>
                  <option value="Check">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Fecha</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Notas / Referencia</label>
                <textarea 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 h-24 resize-none"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Ej: Pago Factura #123, Transferencia Banco..."
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Purchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [cart, setCart] = useState<{product_id: number, quantity: number, cost: number, name: string}[]>([]);
  const [isCurrentAccount, setIsCurrentAccount] = useState(false);

  const fetchPurchases = () => {
    fetch('/api/purchases').then(res => res.json()).then(setPurchases);
  };

  useEffect(() => {
    fetchPurchases();
    fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        quantity: 1, 
        cost: product.cost_price || 0,
        name: `${product.brand} ${product.model}`
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  const handleSave = async () => {
    if (!selectedSupplier || cart.length === 0) return;

    const response = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier_id: parseInt(selectedSupplier),
        items: cart,
        total,
        is_current_account: isCurrentAccount
      })
    });

    if (response.ok) {
      setShowModal(false);
      setCart([]);
      setSelectedSupplier('');
      setIsCurrentAccount(false);
      fetchPurchases();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Compras a Proveedores</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          Nueva Compra
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">Nueva Compra de Mercadería</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Proveedor</label>
                  <select 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Seleccionar Proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Buscar Productos</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-zinc-100 rounded-lg p-2">
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="w-full p-2 text-left hover:bg-zinc-50 rounded flex justify-between items-center text-sm"
                      >
                        <span>{p.brand} {p.model}</span>
                        <span className="font-bold text-zinc-400">${p.cost_price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 flex flex-col">
                <h4 className="font-bold text-sm mb-4">Detalle de Compra</h4>
                <div className="flex-1 space-y-2 overflow-y-auto mb-4">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex justify-between items-center bg-white p-2 rounded border border-zinc-200 text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-zinc-500">${item.cost} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">${item.cost * item.quantity}</span>
                        <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-center text-zinc-400 py-8 text-sm italic">El carrito está vacío</p>
                  )}
                </div>
                <div className="border-t border-zinc-200 pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="is_cc"
                      checked={isCurrentAccount}
                      onChange={(e) => setIsCurrentAccount(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    <label htmlFor="is_cc" className="text-sm font-medium text-zinc-700">Compra a Cuenta Corriente</label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Total:</span>
                    <span className="text-2xl font-black text-zinc-900">${total.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={!selectedSupplier || cart.length === 0}
                    className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">ID</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Fecha</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Proveedor</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Total</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Estado</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">#{p.id}</td>
                <td className="px-6 py-4 text-zinc-600">{new Date(p.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-zinc-900">{p.supplier_name}</td>
                <td className="px-6 py-4 font-bold text-zinc-900">${p.total.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-600">
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Checks = () => {
  const [checks, setChecks] = useState<Check[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<string>('');

  const fetchChecks = () => {
    fetch('/api/checks').then(res => res.json()).then(setChecks);
  };

  useEffect(() => {
    fetchChecks();
    fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
  }, []);

  const handleDeposit = async (id: number) => {
    const res = await fetch(`/api/checks/${id}/deposit`, { method: 'POST' });
    if (res.ok) fetchChecks();
  };

  const handleReturn = async (id: number) => {
    const res = await fetch(`/api/checks/${id}/return`, { method: 'POST' });
    if (res.ok) fetchChecks();
  };

  const handleUseForPayment = async () => {
    if (!selectedCheck || !selectedSupplier) return;
    const res = await fetch(`/api/checks/${selectedCheck.id}/use-for-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: parseInt(selectedSupplier) })
    });
    if (res.ok) {
      setShowPayModal(false);
      setSelectedCheck(null);
      setSelectedSupplier('');
      fetchChecks();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'portfolio': return { label: 'En Cartera', color: 'bg-blue-50 text-blue-600' };
      case 'deposited': return { label: 'Depositado', color: 'bg-emerald-50 text-emerald-600' };
      case 'used_for_payment': return { label: 'Entregado', color: 'bg-amber-50 text-amber-600' };
      case 'returned': return { label: 'Rechazado', color: 'bg-red-50 text-red-600' };
      default: return { label: status, color: 'bg-zinc-50 text-zinc-600' };
    }
  };

  const filteredChecks = checks.filter(c => {
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesSupplier = !filterSupplier || c.supplier_id === parseInt(filterSupplier);
    const matchesDate = !filterDate || c.due_date.startsWith(filterDate);
    return matchesStatus && matchesSupplier && matchesDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Cheques</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors">
            <History size={18} />
            Historial
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-zinc-200 rounded-xl shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Estado</label>
          <select 
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="portfolio">En Cartera</option>
            <option value="deposited">Depositado</option>
            <option value="used_for_payment">Entregado</option>
            <option value="returned">Rechazado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Vencimiento</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Proveedor (Destino)</label>
          <select 
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">Entregar Cheque a Proveedor</h3>
              <button onClick={() => setShowPayModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-zinc-500 mb-2">Cheque: <span className="font-bold text-zinc-900">{selectedCheck?.bank} - {selectedCheck?.number}</span></p>
                <p className="text-sm text-zinc-500 mb-4">Monto: <span className="font-bold text-zinc-900">${selectedCheck?.amount.toLocaleString()}</span></p>
                
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Seleccionar Proveedor</label>
                <select 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Saldo: ${s.balance})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUseForPayment}
                  disabled={!selectedSupplier}
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Confirmar Entrega
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">Vencimiento</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Banco / Nro</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Origen (Cliente)</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Monto</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Estado</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Destino</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredChecks.map((c) => {
              const status = getStatusLabel(c.status);
              return (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{new Date(c.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900">{c.bank}</p>
                    <p className="text-xs text-zinc-500">Nro: {c.number}</p>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{c.customer_name || 'N/A'}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">${c.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", status.color)}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{c.supplier_name || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {c.status === 'portfolio' && (
                        <>
                          <button 
                            onClick={() => handleDeposit(c.id)}
                            className="p-1 text-zinc-400 hover:text-emerald-600 transition-colors"
                            title="Depositar"
                          >
                            <ArrowUpCircle size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedCheck(c);
                              setShowPayModal(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-amber-600 transition-colors"
                            title="Entregar a Proveedor"
                          >
                            <Truck size={18} />
                          </button>
                        </>
                      )}
                      {(c.status === 'portfolio' || c.status === 'deposited') && (
                        <button 
                          onClick={() => handleReturn(c.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Marcar como Rechazado"
                        >
                          <AlertTriangle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DailyCash = () => {
  const [data, setData] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: 0, category: 'Gasto General' });

  const fetchDailyCash = () => {
    fetch(`/api/daily-cash?date=${date}`)
      .then(res => res.json())
      .then(setData);
  };

  useEffect(() => {
    fetchDailyCash();
  }, [date]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseForm.description || !expenseForm.amount || isNaN(expenseForm.amount)) {
      alert('Por favor complete todos los campos correctamente.');
      return;
    }

    try {
      const fullDate = new Date(`${date}T${new Date().toLocaleTimeString('en-GB')}`).toISOString();
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseForm, date: fullDate })
      });

      if (response.ok) {
        setShowExpenseModal(false);
        setExpenseForm({ description: '', amount: 0, category: 'Gasto General' });
        fetchDailyCash();
      } else {
        const errorData = await response.json();
        alert(`Error al registrar el gasto: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error de conexión al registrar el gasto.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const expenseId = id.replace('expense-', '');
    const response = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
    if (response.ok) fetchDailyCash();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-zinc-900">Caja Diaria</h3>
          <input 
            type="date" 
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Ingresos Totales</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${data?.summary.income.toLocaleString() || 0}</p>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Egresos Totales</p>
          <p className="text-2xl font-bold text-red-600 mt-1">${data?.summary.expenses.toLocaleString() || 0}</p>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Saldo del Día</p>
          <p className={cn(
            "text-2xl font-bold mt-1",
            (data?.summary.balance || 0) >= 0 ? "text-zinc-900" : "text-red-600"
          )}>
            ${data?.summary.balance.toLocaleString() || 0}
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
          <h4 className="font-bold text-zinc-900 text-sm">Movimientos del Día</h4>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-900">Hora</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Categoría</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Descripción</th>
              <th className="px-6 py-4 font-semibold text-zinc-900">Método</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Monto</th>
              <th className="px-6 py-4 font-semibold text-zinc-900 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data?.movements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 italic">No hay movimientos registrados para este día.</td>
              </tr>
            ) : (
              data?.movements.map((m: any) => (
                <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-zinc-500">{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      m.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {m.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-900 font-medium">{m.description}</td>
                  <td className="px-6 py-4 text-zinc-500">{m.method}</td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    m.type === 'income' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {m.type === 'income' ? '+' : '-'}${m.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {m.id.startsWith('expense-') && (
                      <button 
                        onClick={() => handleDeleteExpense(m.id)}
                        className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-900">Registrar Gasto</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Descripción</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ej: Alquiler, Luz, Viáticos..."
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Monto</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Categoría</label>
                  <select 
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    <option value="Gasto General">Gasto General</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Sueldos">Sueldos</option>
                    <option value="Impuestos">Impuestos</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/top-products').then(res => res.json()),
      fetch('/api/reports/sales-performance').then(res => res.json()),
      fetch('/api/reports/cash-flow').then(res => res.json())
    ]).then(([top, perf, cash]) => {
      setTopProducts(top);
      setPerformance(perf);
      setCashFlow(cash);
    });
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Ingresos Totales</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${cashFlow?.income.toLocaleString() || 0}</p>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Gastos Totales</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">${cashFlow?.expenses.toLocaleString() || 0}</p>
        </div>
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Balance de Caja</h3>
          <p className={cn(
            "text-2xl font-bold mt-1",
            (cashFlow?.balance || 0) >= 0 ? "text-zinc-900" : "text-red-600"
          )}>
            ${cashFlow?.balance.toLocaleString() || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Ranking de Productos (Más Vendidos)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="brand" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="total_sold" radius={[0, 4, 4, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Distribución de Ingresos vs Gastos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Ingresos', value: cashFlow?.income || 0 },
                    { name: 'Gastos', value: cashFlow?.expenses || 0 }
                  ]}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Evolución de Ventas (Últimos 30 días)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <Tooltip />
              <Line type="monotone" dataKey="total_sales" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats').then(res => res.json()).then(setStats);
  }, []);

  const handleCreateOT = async (appointment: Appointment) => {
    // Fetch service price if not present (simplified for demo)
    const services = await fetch('/api/services').then(res => res.json());
    const service = services.find((s: any) => s.id === appointment.service_id);
    
    const response = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_id: appointment.id,
        customer_id: appointment.customer_id,
        vehicle_id: appointment.vehicle_id,
        items: [
          {
            service_id: appointment.service_id,
            quantity: 1,
            price: service?.price || 0
          }
        ],
        notes: appointment.notes
      })
    });

    if (response.ok) {
      alert('Orden de Trabajo creada con éxito');
      setActiveTab('work-orders');
    }
  };

  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} />;
      case 'inventory': return <Inventory />;
      case 'pos': return <POS />;
      case 'appointments': return <Appointments onCreateOT={handleCreateOT} />;
      case 'work-orders': return <WorkOrders />;
      case 'customers': return <Customers />;
      case 'cuenta-corriente': return <CuentaCorriente />;
      case 'vehicles': return <Vehicles />;
      case 'suppliers': return <Suppliers />;
      case 'cc-suppliers': return <CuentaCorrienteProveedores />;
      case 'purchases': return <Purchases />;
      case 'checks': return <Checks />;
      case 'daily-cash': return <DailyCash />;
      case 'reports': return <Reports />;
      default: return <Dashboard stats={stats} />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'pos', label: 'Ventas (POS)', icon: ShoppingCart },
    { id: 'appointments', label: 'Turnos', icon: Calendar },
    { id: 'work-orders', label: 'Órdenes de Trabajo', icon: FileText },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'cuenta-corriente', label: 'Cuenta Corriente', icon: History },
    { id: 'vehicles', label: 'Vehículos', icon: Truck },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'cc-suppliers', label: 'CC Proveedores', icon: ArrowDownCircle },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart },
    { id: 'checks', label: 'Cheques', icon: Banknote },
    { id: 'daily-cash', label: 'Caja Diaria', icon: DollarSign },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transition-transform lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Wrench className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">GomeriaPro</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {tabs.map((tab) => (
              <SidebarItem 
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-100">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <div>
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-zinc-500">Gomeria Central</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
              <Search size={20} />
            </button>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="text-right">
              <p className="text-xs font-medium text-zinc-500">25 Feb 2026</p>
              <p className="text-xs font-bold">06:01 AM</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}
