const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:5000', 'http://127.0.0.1:5500']; // Add your hosted frontend URL (e.g., 'https://infiniti-spare-parts.netlify.app') after deployment

app.use(bodyParser.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const secret = 'aVeryLongRandomSecretKey123!@#';

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
}

app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(row => row.images = JSON.parse(row.images || '[]'));
    res.json(rows);
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  db.run("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)", [name, email, message], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Submission received', id: this.lastID });
  });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) return res.status(401).json({ error: 'Invalid credentials' });
      const token = generateToken(user);
      res.json({ token });
    });
  });
});

app.post('/api/admin/products', verifyToken, upload.array('images', 3), (req, res) => {
  const { name, sku, description, price, category, stock } = req.body;
  const images = req.files ? req.files.map(file => file.filename) : [];
  db.run(
    "INSERT INTO products (name, sku, description, price, category, images, stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, sku, description, price, category, JSON.stringify(images), stock],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Product added', id: this.lastID });
    }
  );
});

app.put('/api/admin/products/:id', verifyToken, upload.array('images', 3), (req, res) => {
  const { id } = req.params;
  const { name, sku, description, price, category, stock } = req.body;
  let images = req.files ? req.files.map(file => file.filename) : null;

  db.get("SELECT images FROM products WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Product not found' });
    images = images ? JSON.stringify(images) : row.images;
    db.run(
      "UPDATE products SET name = ?, sku = ?, description = ?, price = ?, category = ?, images = ?, stock = ? WHERE id = ?",
      [name, sku, description, price, category, images, stock, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product updated' });
      }
    );
  });
});

app.delete('/api/admin/products/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product deleted' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});