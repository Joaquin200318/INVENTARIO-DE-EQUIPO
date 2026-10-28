const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Inicializacion de Base de Datos SQLite
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error abriendo SQLite:', err.message);
  else console.log('âœ… Conectado a la base de datos SQLite en:', dbPath);
});

// Creacion de Tablas y Seed Inicial
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  // 1. Tabla de Usuarios (Roles: admin = Nivel 2, operator = Nivel 1)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL
  )`);

  // 2. Tabla de Departamentos
  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    location TEXT
  )`);

  // 3. Tabla de Empleados (Vinculados a un Departamento)
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT,
    position TEXT,
    department_id INTEGER NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
  )`);

  // 4. Tabla de Activos IT (CRUD Principal)
  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    TeamViewer TEXT UNIQUE NOT NULL,
    brand_model TEXT NOT NULL,
    department_id INTEGER,
    employee_id INTEGER,
    connection_type TEXT DEFAULT 'IP',
    ip_address TEXT UNIQUE,
    mac_address TEXT,
    hostname TEXT,
    status TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
  )`);

  // 5. Tabla de Stock de Deposito / Panol IT
  db.run(`CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    brand_model TEXT NOT NULL,
    specs TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 2,
    location TEXT DEFAULT 'Deposito Central IT'
  )`);

  // Verificar si ya existen datos para ejecutar el Seed
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (row && row.count === 0) {
      console.log('ðŸŒ± Poblando base de datos con datos de prueba (Seed)...');

      // Usuarios: Nivel 2 (Admin) y Nivel 1 (Operador)
      db.run(`INSERT INTO users (username, password, role, full_name) VALUES 
        ('admin', 'admin123', 'admin', 'Administrador IT (Nivel 2)'),
        ('soporte', 'soporte123', 'operator', 'Operador de Soporte (Nivel 1)')`);

      // Departamentos iniciales
      db.run(`INSERT INTO departments (name, location) VALUES 
        ('Sistemas e Infraestructura', 'Piso 3 - Oficina 301'),
        ('Administracion y Finanzas', 'Piso 2 - Oficina 204'),
        ('Recursos Humanos', 'Piso 1 - Oficina 102'),
        ('Ventas y Comercial', 'Piso 1 - Sala General')`, () => {

        // Empleados iniciales
        db.run(`INSERT INTO employees (full_name, email, position, department_id) VALUES 
          ('Carlos Gomez', 'cgomez@empresa.com', 'SysAdmin Senior', 1),
          ('Laura Martinez', 'lmartinez@empresa.com', 'Analista Contable', 2),
          ('Martin Rodriguez', 'mrodriguez@empresa.com', 'Jefe de Compras', 2),
          ('Sofia Lopez', 'slopez@empresa.com', 'Recruiter IT', 3),
          ('Diego Fernandez', 'dfernandez@empresa.com', 'Ejecutivo de Cuentas', 4)`, () => {

          // Activos IT iniciales (PCs, Notebooks, Impresoras Red/USB, Telefono IP, Switch, DVR)
          db.run(`INSERT INTO assets (category, TeamViewer, brand_model, department_id, employee_id, connection_type, ip_address, mac_address, hostname, status, notes) VALUES 
            ('Notebook', '123456789', 'Dell Latitude 5430 i7 16GB', 1, 1, 'IP', '192.168.1.10', '00:1B:44:11:3A:B7', 'NB-SIS-CGOMEZ', 'Operativo', 'Equipo principal de administracion de red'),
            ('PC', '987654321', 'HP ProDesk 400 G7 i5', 2, 2, 'IP', '192.168.1.25', NULL, NULL, 'Operativo', 'Doble monitor asignado'),
            ('Notebook', '456789123', 'Lenovo ThinkPad T14 Gen 3', 3, 4, 'IP', '192.168.1.42', 'A4:83:E7:22:9C:11', 'NB-RRHH-SLOPEZ', 'Requiere Mantenimiento', 'Bateria reporta desgaste y calentamiento'),
            ('Impresora', '321654987', 'Brother HL-L5100DN Laser', 2, NULL, 'IP', '192.168.1.200', NULL, NULL, 'Operativo', 'Impresora departamental de Finanzas'),
            ('Impresora', '654987321', 'Epson EcoTank L3210', 3, 4, 'USB', NULL, NULL, NULL, 'Operativo', 'Conectada por USB al puesto de Sofia'),
            ('Telefono IP', 'SN-YEA-88321', 'Yealink SIP-T31P', 4, 5, 'IP', '192.168.2.55', NULL, NULL, 'En Reparacion', 'Fuente PoE danada'),
            ('Switch', 'SN-CIS-00192', 'Cisco Catalyst 2960 24p PoE', 1, 1, 'IP', '192.168.1.2', NULL, NULL, 'Operativo', 'Rack Principal Piso 3'),
            ('DVR/NVR', 'SN-HIK-33910', 'Hikvision NVR 16 Canales 4K', 1, 1, 'IP', '192.168.1.240', NULL, NULL, 'Operativo', 'CCTV Seguridad Edificio'),
            ('PC', 'SN-CLON-10023', 'PC Desktop Core 2 Duo 4GB', 4, NULL, 'Sin Red', NULL, NULL, NULL, 'Dado de Baja', 'Equipo obsoleto retirado de Ventas')`);
        });
      });

      // Stock de Deposito inicial (SSD, HDD, RAM, Fuentes, Monitores en stock)
      db.run(`INSERT INTO stock_items (item_type, brand_model, specs, quantity, min_stock, location) VALUES 
        ('Disco SSD', 'Kingston NV2', '500GB M.2 NVMe PCIe 4.0', 8, 3, 'Armario A - Estante 1'),
        ('Disco SSD', 'Crucial BX500', '480GB SATA 2.5"', 2, 4, 'Armario A - Estante 1'),
        ('Memoria RAM', 'Kingston Fury Beast', '8GB DDR4 3200MHz SODIMM (Notebook)', 6, 3, 'Armario A - Gaveta 2'),
        ('Memoria RAM', 'Corsair Vengeance', '8GB DDR4 3000MHz DIMM (PC)', 4, 2, 'Armario A - Gaveta 3'),
        ('Fuente ATX', 'Thermaltake Smart', '500W 80 Plus White', 1, 2, 'Armario B - Estante 2'),
        ('Disco HDD', 'Western Digital Purple', '4TB SATA 3.5" Especial CCTV/DVR', 3, 1, 'Armario B - Estante 1'),
        ('Switch', 'TP-Link TL-SG108', '8 Puertos Gigabit No Administrable (Backup)', 2, 1, 'Armario C - Red')`);
    }
  });
});

// Validacion auxiliar de formato IPv4
function isValidIPv4(ip) {
  if (!ip) return true;
  const regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return regex.test(ip);
}

// ============================================================================
// ENDPOINTS: AUTENTICACION
// ============================================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT id, username, role, full_name FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
      res.json(user);
    }
  );
});

// ============================================================================
// ENDPOINTS: DEPARTAMENTOS Y EMPLEADOS (ORGANIZACION)
// ============================================================================
app.get('/api/departments', (req, res) => {
  const query = `
    SELECT d.*, 
      (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) as employee_count,
      (SELECT COUNT(*) FROM assets a WHERE a.department_id = d.id) as asset_count
    FROM departments d ORDER BY d.name ASC`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/departments', (req, res) => {
  const { name, location } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre del departamento es obligatorio' });
  db.run('INSERT INTO departments (name, location) VALUES (?, ?)', [name.trim(), location || ''], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Ese departamento ya existe' });
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name: name.trim(), location });
  });
});

app.delete('/api/departments/:id', (req, res) => {
  db.run('DELETE FROM departments WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/employees', (req, res) => {
  const query = `
    SELECT e.*, d.name as department_name,
      (SELECT COUNT(*) FROM assets a WHERE a.employee_id = e.id) as assigned_assets
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.full_name ASC`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/employees', (req, res) => {
  const { full_name, email, position, department_id } = req.body;
  if (!full_name || !department_id) {
    return res.status(400).json({ error: 'Nombre completo y departamento son obligatorios' });
  }
  db.run(
    'INSERT INTO employees (full_name, email, position, department_id) VALUES (?, ?, ?, ?)',
    [full_name.trim(), email || '', position || '', department_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, full_name, email, position, department_id });
    }
  );
});

app.delete('/api/employees/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ============================================================================
// ENDPOINTS: ACTIVOS IT (CRUD COMPLETO Y VALIDACIONES DE RED)
// ============================================================================
app.get('/api/assets', (req, res) => {
  const query = `
    SELECT a.*, d.name as department_name, e.full_name as employee_name, e.position as employee_position
    FROM assets a
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN employees e ON a.employee_id = e.id
    ORDER BY a.id DESC`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/assets', (req, res) => {
  const { category, TeamViewer, brand_model, department_id, employee_id, connection_type, ip_address, mac_address, hostname, status, notes } = req.body;
  if (!category || !TeamViewer || !brand_model || !status) {
    return res.status(400).json({ error: 'Categoria, TeamViewer, Marca/Modelo y Estado son obligatorios.' });
  }

  const cleanIP = (ip_address && ip_address.trim() !== '' && connection_type !== 'USB' && connection_type !== 'Sin Red') ? ip_address.trim() : null;
  if (cleanIP && !isValidIPv4(cleanIP)) {
    return res.status(400).json({ error: 'El formato de la Direccion IPv4 no es valido (Ej: 192.168.1.50).' });
  }

  const sql = `INSERT INTO assets 
    (category, TeamViewer, brand_model, department_id, employee_id, connection_type, ip_address, mac_address, hostname, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    category,
    TeamViewer.trim().toUpperCase(),
    brand_model.trim(),
    department_id || null,
    employee_id || null,
    connection_type || 'IP',
    cleanIP,
    category === 'Notebook' ? (mac_address || null) : null,
    category === 'Notebook' ? (hostname || null) : null,
    status,
    notes || ''
  ], function(err) {
    if (err) {
      if (err.message.includes('assets.TeamViewer')) {
        return res.status(400).json({ error: 'Ya existe un equipo registrado con ese Numero de TeamViewer.' });
      }
      if (err.message.includes('assets.ip_address')) {
        return res.status(400).json({ error: `Conflicto de red: La IP ${cleanIP} ya esta asignada a otro dispositivo.` });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

app.put('/api/assets/:id', (req, res) => {
  const { category, TeamViewer, brand_model, department_id, employee_id, connection_type, ip_address, mac_address, hostname, status, notes } = req.body;
  const cleanIP = (ip_address && ip_address.trim() !== '' && connection_type !== 'USB' && connection_type !== 'Sin Red') ? ip_address.trim() : null;

  if (cleanIP && !isValidIPv4(cleanIP)) {
    return res.status(400).json({ error: 'El formato de la Direccion IPv4 no es valido.' });
  }

  const sql = `UPDATE assets SET
    category = ?, TeamViewer = ?, brand_model = ?, department_id = ?, employee_id = ?,
    connection_type = ?, ip_address = ?, mac_address = ?, hostname = ?, status = ?, notes = ?
    WHERE id = ?`;

  db.run(sql, [
    category,
    TeamViewer.trim().toUpperCase(),
    brand_model.trim(),
    department_id || null,
    employee_id || null,
    connection_type || 'IP',
    cleanIP,
    category === 'Notebook' ? (mac_address || null) : null,
    category === 'Notebook' ? (hostname || null) : null,
    status,
    notes || '',
    req.params.id
  ], function(err) {
    if (err) {
      if (err.message.includes('assets.TeamViewer')) {
        return res.status(400).json({ error: 'Numero de TeamViewer duplicado en otro registro.' });
      }
      if (err.message.includes('assets.ip_address')) {
        return res.status(400).json({ error: `Conflicto de red: La IP ${cleanIP} ya pertenece a otro equipo.` });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ updated: this.changes });
  });
});

// Endpoint para Operador Nivel 1: Reportar Falla (Cambia estado a "Requiere Mantenimiento")
app.patch('/api/assets/:id/status', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE assets SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/assets/:id', (req, res) => {
  db.run('DELETE FROM assets WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ============================================================================
// ENDPOINTS: DEPOSITO / STOCK DE REPUESTOS
// ============================================================================
app.get('/api/stock', (req, res) => {
  db.all('SELECT * FROM stock_items ORDER BY item_type ASC, brand_model ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/stock', (req, res) => {
  const { item_type, brand_model, specs, quantity, min_stock, location } = req.body;
  if (!item_type || !brand_model) return res.status(400).json({ error: 'Tipo de insumo y Marca/Modelo son obligatorios.' });
  db.run(
    'INSERT INTO stock_items (item_type, brand_model, specs, quantity, min_stock, location) VALUES (?, ?, ?, ?, ?, ?)',
    [item_type, brand_model.trim(), specs || '', Number(quantity) || 0, Number(min_stock) || 1, location || 'Deposito IT'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.patch('/api/stock/:id/quantity', (req, res) => {
  const { delta } = req.body;
  db.run(
    'UPDATE stock_items SET quantity = MAX(0, quantity + ?) WHERE id = ?',
    [Number(delta), req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/stock/:id', (req, res) => {
  db.run('DELETE FROM stock_items WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`ðŸš€ Servidor Backend IT Asset Manager corriendo en http://localhost:${PORT}`);
});
