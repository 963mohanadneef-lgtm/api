const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const cors = require('cors');

// Enable CORS
server.use(cors());

// Custom middleware
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom routes
server.post('/api/orders', (req, res) => {
  const db = router.db;
  const orders = db.get('orders');
  
  const newOrder = {
    id: Date.now(),
    ...req.body,
    status: 'جديد',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder).write();
  res.json(newOrder);
});

server.get('/api/orders', (req, res) => {
  const db = router.db;
  const orders = db.get('orders').value();
  res.json(orders);
});

server.get('/api/menu', (req, res) => {
  const db = router.db;
  const menu = db.get('menu').value();
  res.json(menu);
});

server.post('/api/menu', (req, res) => {
  const db = router.db;
  const menu = db.get('menu');
  
  const newItem = {
    id: Date.now(),
    ...req.body
  };
  
  menu.push(newItem).write();
  res.json(newItem);
});

server.put('/api/menu/:id', (req, res) => {
  const db = router.db;
  const menu = db.get('menu');
  const id = parseInt(req.params.id);
  
  menu.find({ id }).assign(req.body).write();
  res.json(req.body);
});

server.delete('/api/menu/:id', (req, res) => {
  const db = router.db;
  const menu = db.get('menu');
  const id = parseInt(req.params.id);
  
  menu.remove({ id }).write();
  res.json({ id });
});

// Use router
server.use('/api', router);

// Start server
const port = 3000;
server.listen(port, () => {
  console.log(`✅ API Server running on http://localhost:${port}`);
  console.log(`📍 Menu API: http://localhost:${port}/api/menu`);
  console.log(`📍 Orders API: http://localhost:${port}/api/orders`);
});