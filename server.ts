import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Note: Ensure your Supabase tables match the schema provided in the documentation.
// You can run the SQL schema in the Supabase SQL Editor.

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
   // Dashboard Metrics
  app.get("/api/dashboard/stats", async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: salesToday } = await supabase.from('sales').select('total').gte('date', today).eq('status', 'completed');
    const { count: servicesToday } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'completed');
    const { count: criticalStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock', 'min_stock');
    const { count: pendingAppointments } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', today).eq('status', 'pending');

    const totalSales = salesToday?.reduce((acc, sale) => acc + sale.total, 0) || 0;

    res.json({
      salesToday: totalSales,
      servicesToday: servicesToday || 0,
      criticalStock: criticalStock || 0,
      pendingAppointments: pendingAppointments || 0
    });
  });

  // Products
  app.get("/api/products", async (req, res) => {
    const { data: products } = await supabase.from('products').select('*');
    res.json(products || []);
  });

  app.post("/api/products/massive-update", async (req, res) => {
    const { percentage, type, brand } = req.body;
    // Massive update is harder with JS client, usually done via RPC or multiple updates
    // For now, we'll fetch and update (not efficient but works for small sets)
    let query = supabase.from('products').select('*');
    if (type) query = query.eq('type', type);
    if (brand) query = query.eq('brand', brand);

    const { data: products } = await query;
    if (!products) return res.json({ updated: 0 });

    const updates = products.map(p => ({
      ...p,
      price: p.price * (1 + percentage / 100)
    }));

    const { data, error } = await supabase.from('products').upsert(updates);
    res.json({ updated: products.length });
  });

  app.post("/api/products", async (req, res) => {
    const { brand, model, rim, width, profile, type, price, stock, min_stock, sku } = req.body;
    const { data, error } = await supabase.from('products').insert([{
      brand, model, rim, width, profile, type, price, stock, min_stock, sku
    }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data?.[0]?.id });
  });

  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { brand, model, rim, width, profile, type, price, stock, min_stock, sku } = req.body;
    const { data, error } = await supabase.from('products').update({
      brand, model, rim, width, profile, type, price, stock, min_stock, sku
    }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Sales
  app.post("/api/sales", async (req, res) => {
    const { customer_id, items, total, payment_method, payment_details, status } = req.body;
    
    const { data: sale, error: saleError } = await supabase.from('sales').insert([{
      customer_id, total, payment_method, payment_details: JSON.stringify(payment_details), status
    }]).select();

    if (saleError) return res.status(500).json({ error: saleError.message });
    const saleId = sale[0].id;

    for (const item of items) {
      await supabase.from('sale_items').insert([{
        sale_id: saleId, 
        product_id: item.product_id || null, 
        service_id: item.service_id || null, 
        quantity: item.quantity, 
        price: item.price
      }]);
      
      if (item.product_id && status === 'completed') {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.product_id);
        }
      }
    }

    if (payment_method === 'Current Account' && customer_id && status === 'completed') {
      const { data: cust } = await supabase.from('customers').select('balance').eq('id', customer_id).single();
      if (cust) {
        await supabase.from('customers').update({ balance: cust.balance + total }).eq('id', customer_id);
      }
    }

    if (payment_method === 'Check' && payment_details?.check && status === 'completed') {
      const { bank, number, amount, due_date } = payment_details.check;
      await supabase.from('checks').insert([{
        bank, number, amount, due_date, source_sale_id: saleId, customer_id
      }]);
    }

    res.json({ id: saleId });
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    const { data: appointments } = await supabase.from('appointments').select(`
      *,
      customers (name),
      vehicles (license_plate),
      services (name)
    `).order('date', { ascending: true }).order('time', { ascending: true });
    
    // Flatten the response to match the old format
    const flattened = appointments?.map(a => ({
      ...a,
      customer_name: (a as any).customers?.name,
      license_plate: (a as any).vehicles?.license_plate,
      service_name: (a as any).services?.name
    }));

    res.json(flattened || []);
  });

  app.post("/api/appointments", async (req, res) => {
    const { date, time, customer_id, vehicle_id, service_id, notes, status } = req.body;
    const { data, error } = await supabase.from('appointments').insert([{
      date, time, customer_id, vehicle_id, service_id, notes, status: status || 'pending'
    }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data?.[0]?.id });
  });

  app.put("/api/appointments/:id", async (req, res) => {
    const { id } = req.params;
    const { date, time, customer_id, vehicle_id, service_id, notes, status } = req.body;
    const { data, error } = await supabase.from('appointments').update({
      date, time, customer_id, vehicle_id, service_id, notes, status
    }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Customers & Vehicles
  app.get("/api/customers", async (req, res) => {
    const { data: customers } = await supabase.from('customers').select('*');
    res.json(customers || []);
  });

  app.post("/api/customers", async (req, res) => {
    const { name, phone, email, address } = req.body;
    const { data, error } = await supabase.from('customers').insert([{
      name, phone, email, address
    }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data?.[0]?.id });
  });

  app.put("/api/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, address, balance } = req.body;
    const { data, error } = await supabase.from('customers').update({
      name, phone, email, address, balance
    }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Customer Current Account (Cuenta Corriente)
  app.get("/api/customers/:id/transactions", async (req, res) => {
    const { id } = req.params;
    
    // Fetch sales on current account
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', id)
      .eq('payment_method', 'Current Account');

    // Fetch payments
    const { data: payments } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('customer_id', id);

    const transactions = [
      ...(sales || []).map(s => ({
        id: `sale-${s.id}`,
        date: s.date,
        description: `Venta #${s.id}`,
        amount: s.total,
        type: 'debit' // Customer owes more
      })),
      ...(payments || []).map(p => ({
        id: `pay-${p.id}`,
        date: p.date,
        description: `Pago (${p.payment_method}) - ${p.notes || ''}`,
        amount: p.amount,
        type: 'credit' // Customer owes less
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(transactions);
  });

  app.post("/api/customer-payments", async (req, res) => {
    const { customer_id, amount, payment_method, notes, date } = req.body;
    
    const { data: payment, error: payError } = await supabase
      .from('customer_payments')
      .insert([{ customer_id, amount, payment_method, notes, date: date || new Date().toISOString() }])
      .select();

    if (payError) return res.status(500).json({ error: payError.message });

    // Update customer balance
    const { data: cust } = await supabase.from('customers').select('balance').eq('id', customer_id).single();
    if (cust) {
      await supabase.from('customers').update({ balance: cust.balance - amount }).eq('id', customer_id);
    }

    res.json(payment?.[0]);
  });

  app.get("/api/vehicles", async (req, res) => {
    const { data: vehicles } = await supabase.from('vehicles').select(`
      *,
      customers (name)
    `);
    const flattened = vehicles?.map(v => ({
      ...v,
      owner_name: (v as any).customers?.name
    }));
    res.json(flattened || []);
  });

  app.post("/api/vehicles", async (req, res) => {
    const { license_plate, brand, model, year, customer_id } = req.body;
    const { data, error } = await supabase.from('vehicles').insert([{
      license_plate, brand, model, year, customer_id
    }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data?.[0]?.id });
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    const { id } = req.params;
    const { license_plate, brand, model, year, customer_id } = req.body;
    const { data, error } = await supabase.from('vehicles').update({
      license_plate, brand, model, year, customer_id
    }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    const { data: suppliers } = await supabase.from('suppliers').select('*');
    res.json(suppliers || []);
  });

  app.post("/api/suppliers", async (req, res) => {
    const { name, contact, phone, address } = req.body;
    const { data, error } = await supabase.from('suppliers').insert([{
      name, contact, phone, address
    }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data?.[0]?.id });
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, contact, phone, address, balance } = req.body;
    const { data, error } = await supabase.from('suppliers').update({
      name, contact, phone, address, balance
    }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Supplier Current Account (Cuenta Corriente Proveedores)
  app.get("/api/suppliers/:id/transactions", async (req, res) => {
    const { id } = req.params;
    
    // Fetch purchases on current account (assuming all purchases go to CC for simplicity or we filter)
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('supplier_id', id);

    // Fetch payments to suppliers
    const { data: payments } = await supabase
      .from('supplier_payments')
      .select('*')
      .eq('supplier_id', id);

    const transactions = [
      ...(purchases || []).map(p => ({
        id: `purchase-${p.id}`,
        date: p.date,
        description: `Compra #${p.id}`,
        amount: p.total,
        type: 'debit' // We owe more
      })),
      ...(payments || []).map(p => ({
        id: `pay-${p.id}`,
        date: p.date,
        description: `Pago a Proveedor (${p.payment_method}) - ${p.notes || ''}`,
        amount: p.amount,
        type: 'credit' // We owe less
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(transactions);
  });

  app.post("/api/supplier-payments", async (req, res) => {
    const { supplier_id, amount, payment_method, notes, date } = req.body;
    
    const { data: payment, error: payError } = await supabase
      .from('supplier_payments')
      .insert([{ supplier_id, amount, payment_method, notes, date: date || new Date().toISOString() }])
      .select();

    if (payError) return res.status(500).json({ error: payError.message });

    // Update supplier balance
    const { data: supp } = await supabase.from('suppliers').select('balance').eq('id', supplier_id).single();
    if (supp) {
      await supabase.from('suppliers').update({ balance: supp.balance - amount }).eq('id', supplier_id);
    }

    res.json(payment?.[0]);
  });

  // Purchases
  app.get("/api/purchases", async (req, res) => {
    const { data: purchases } = await supabase.from('purchases').select(`
      *,
      suppliers (name)
    `).order('date', { ascending: false });
    
    const flattened = purchases?.map(p => ({
      ...p,
      supplier_name: (p as any).suppliers?.name
    }));
    res.json(flattened || []);
  });

  app.post("/api/purchases", async (req, res) => {
    const { supplier_id, items, total, is_current_account } = req.body;
    
    const { data: purchase, error: purchaseError } = await supabase.from('purchases').insert([{
      supplier_id, total
    }]).select();

    if (purchaseError) return res.status(500).json({ error: purchaseError.message });
    const purchaseId = purchase[0].id;

    for (const item of items) {
      await supabase.from('purchase_items').insert([{
        purchase_id: purchaseId, 
        product_id: item.product_id, 
        quantity: item.quantity, 
        cost: item.cost
      }]);
      
      const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
      if (prod) {
        await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
      }
    }
    
    if (is_current_account) {
      const { data: supp } = await supabase.from('suppliers').select('balance').eq('id', supplier_id).single();
      if (supp) {
        await supabase.from('suppliers').update({ balance: supp.balance + total }).eq('id', supplier_id);
      }
    }

    res.json({ id: purchaseId });
  });

  // Checks
  app.get("/api/checks", async (req, res) => {
    const { data: checks } = await supabase.from('checks').select(`
      *,
      customers (name),
      suppliers (name)
    `).order('due_date', { ascending: true });

    const flattened = checks?.map(ch => ({
      ...ch,
      customer_name: (ch as any).customers?.name,
      supplier_name: (ch as any).suppliers?.name
    }));
    res.json(flattened || []);
  });

  app.post("/api/checks/:id/use-for-payment", async (req, res) => {
    const id = parseInt(req.params.id);
    const { supplier_id, purchase_id } = req.body;
    
    const { data: check } = await supabase.from('checks').select('*').eq('id', id).single();
    if (!check) return res.status(404).json({ error: "Check not found" });

    await supabase.from('checks').update({ 
      status: 'used_for_payment', 
      supplier_id, 
      target_purchase_id: purchase_id 
    }).eq('id', id);

    const { data: supp } = await supabase.from('suppliers').select('balance').eq('id', supplier_id).single();
    if (supp) {
      await supabase.from('suppliers').update({ balance: supp.balance - check.amount }).eq('id', supplier_id);
    }
    
    res.json({ success: true });
  });

  app.post("/api/checks/:id/deposit", async (req, res) => {
    const id = parseInt(req.params.id);
    const { error } = await supabase.from('checks').update({ status: 'deposited' }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.post("/api/checks/:id/return", async (req, res) => {
    const id = parseInt(req.params.id);
    const { data: check } = await supabase.from('checks').select('*').eq('id', id).single();
    if (!check) return res.status(404).json({ error: "Check not found" });

    await supabase.from('checks').update({ status: 'returned' }).eq('id', id);

    // If it came from a customer, we might want to re-add the debt to their account
    if (check.customer_id) {
      const { data: cust } = await supabase.from('customers').select('balance').eq('id', check.customer_id).single();
      if (cust) {
        await supabase.from('customers').update({ balance: cust.balance + check.amount }).eq('id', check.customer_id);
      }
    }

    res.json({ success: true });
  });

  // Services
  app.get("/api/services", async (req, res) => {
    const { data: services } = await supabase.from('services').select('*');
    res.json(services || []);
  });

  // Work Orders
  app.get("/api/work-orders", async (req, res) => {
    const { data: orders } = await supabase.from('work_orders').select(`
      *,
      customers (name),
      vehicles (license_plate)
    `).order('date', { ascending: false });

    const flattened = orders?.map(wo => ({
      ...wo,
      customer_name: (wo as any).customers?.name,
      license_plate: (wo as any).vehicles?.license_plate
    }));
    res.json(flattened || []);
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    const { id } = req.params;
    const { data: order, error } = await supabase.from('work_orders').select(`
      *,
      customers (*),
      vehicles (*),
      work_order_items (*, services (*), products (*))
    `).eq('id', id).single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(order);
  });

  app.put("/api/work-orders/:id", async (req, res) => {
    const { id } = req.params;
    const { status, notes, total } = req.body;
    const { data, error } = await supabase.from('work_orders').update({
      status, notes, total
    }).eq('id', id).select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/work-orders/:id", async (req, res) => {
    const { id } = req.params;
    // Items will be deleted if ON DELETE CASCADE is set, otherwise manual delete needed
    await supabase.from('work_order_items').delete().eq('work_order_id', id);
    const { error } = await supabase.from('work_orders').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    const { data: expenses } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    res.json(expenses || []);
  });

  app.post("/api/expenses", async (req, res) => {
    const { description, amount, category, date } = req.body;
    const { data, error } = await supabase.from('expenses').insert([{
      description, amount, category, date: date || new Date().toISOString()
    }]).select();
    if (error) {
      console.error("Error inserting expense:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data?.[0]);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Daily Cash
  app.get("/api/daily-cash", async (req, res) => {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    
    // Fetch all movements for the day
    const [sales, purchases, payments, expenses] = await Promise.all([
      supabase.from('sales').select('*, customers(name)').filter('date', 'gte', `${targetDate}T00:00:00`).filter('date', 'lte', `${targetDate}T23:59:59`),
      supabase.from('purchases').select('*, suppliers(name)').filter('date', 'gte', `${targetDate}T00:00:00`).filter('date', 'lte', `${targetDate}T23:59:59`),
      supabase.from('supplier_payments').select('*, suppliers(name)').filter('date', 'gte', `${targetDate}T00:00:00`).filter('date', 'lte', `${targetDate}T23:59:59`),
      supabase.from('expenses').select('*').filter('date', 'gte', `${targetDate}T00:00:00`).filter('date', 'lte', `${targetDate}T23:59:59`)
    ]);

    if (expenses.error) {
      console.error("Error fetching expenses for daily cash:", expenses.error);
    }
    if (sales.error) console.error("Error fetching sales for daily cash:", sales.error);
    if (purchases.error) console.error("Error fetching purchases for daily cash:", purchases.error);
    if (payments.error) console.error("Error fetching payments for daily cash:", payments.error);

    const movements: any[] = [];

    sales.data?.forEach(s => {
      // Only cash/card sales count as immediate income, but let's list all for visibility
      movements.push({
        id: `sale-${s.id}`,
        type: 'income',
        category: 'Venta',
        description: `Venta #${s.id} - ${(s as any).customers?.name || 'Consumidor Final'}`,
        amount: s.total,
        method: s.payment_method,
        date: s.date
      });
    });

    purchases.data?.forEach(p => {
      movements.push({
        id: `purchase-${p.id}`,
        type: 'expense',
        category: 'Compra',
        description: `Compra #${p.id} - ${(p as any).suppliers?.name}`,
        amount: p.total,
        method: 'Contado', // Purchases are assumed cash unless CC
        date: p.date
      });
    });

    payments.data?.forEach(p => {
      movements.push({
        id: `payment-${p.id}`,
        type: 'expense',
        category: 'Pago Proveedor',
        description: `Pago a ${(p as any).suppliers?.name}`,
        amount: p.amount,
        method: p.payment_method,
        date: p.date
      });
    });

    expenses.data?.forEach(e => {
      movements.push({
        id: `expense-${e.id}`,
        type: 'expense',
        category: e.category || 'Gasto General',
        description: e.description,
        amount: e.amount,
        method: 'Efectivo',
        date: e.date
      });
    });

    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIncome = movements.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);
    const totalExpense = movements.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);

    res.json({
      date: targetDate,
      movements,
      summary: {
        income: totalIncome,
        expenses: totalExpense,
        balance: totalIncome - totalExpense
      }
    });
  });

  // Reports
  app.get("/api/reports/top-products", async (req, res) => {
    // Complex aggregation is better via RPC, but we can do it in JS for now
    const { data: items } = await supabase.from('sale_items').select('product_id, quantity, products(brand, model)');
    const aggregated: any = {};
    items?.forEach((si: any) => {
      const key = si.product_id;
      if (!aggregated[key]) {
        aggregated[key] = { 
          brand: si.products.brand, 
          model: si.products.model, 
          total_sold: 0 
        };
      }
      aggregated[key].total_sold += si.quantity;
    });

    const result = Object.values(aggregated)
      .sort((a: any, b: any) => b.total_sold - a.total_sold)
      .slice(0, 5);

    res.json(result);
  });

  app.get("/api/reports/sales-performance", async (req, res) => {
    const { data: sales } = await supabase.from('sales').select('date, total').eq('status', 'completed');
    const aggregated: any = {};
    sales?.forEach(s => {
      const day = s.date.split('T')[0];
      aggregated[day] = (aggregated[day] || 0) + s.total;
    });

    const result = Object.entries(aggregated).map(([day, total_sales]) => ({
      day, total_sales
    })).sort((a, b) => a.day.localeCompare(b.day)).slice(-30);

    res.json(result);
  });

  app.get("/api/reports/cash-flow", async (req, res) => {
    const { data: sales } = await supabase.from('sales').select('total').eq('status', 'completed');
    const { data: purchases } = await supabase.from('purchases').select('total');

    const totalIncome = sales?.reduce((acc, s) => acc + s.total, 0) || 0;
    const totalExpenses = purchases?.reduce((acc, p) => acc + p.total, 0) || 0;

    res.json({
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses
    });
  });

  app.post("/api/work-orders", async (req, res) => {
    const { appointment_id, customer_id, vehicle_id, items, notes } = req.body;
    
    const total = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const { data: wo, error: woError } = await supabase.from('work_orders').insert([{
      appointment_id, customer_id, vehicle_id, total, notes
    }]).select();

    if (woError) return res.status(500).json({ error: woError.message });
    const woId = wo[0].id;

    for (const item of items) {
      await supabase.from('work_order_items').insert([{
        work_order_id: woId, 
        service_id: item.service_id || null, 
        product_id: item.product_id || null, 
        quantity: item.quantity, 
        price: item.price
      }]);
    }

    if (appointment_id) {
      await supabase.from('appointments').update({ status: 'in_progress' }).eq('id', appointment_id);
    }

    res.json({ id: woId });
  });
;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
