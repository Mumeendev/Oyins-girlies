require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 1000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://images.unsplash.com", "https://media.istockphoto.com"],
      "script-src": ["'self'", "'unsafe-inline'"], // Needed for scroll reveal and other inline scripts
    },
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Validate Environment Variables
const requiredEnv = ['DATABASE_URL', 'EMAIL_USER', 'EMAIL_PASS'];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    console.warn(`WARNING: ${env} is not defined. Some features may not work.`);
  }
});

// Email Transporter Setup
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  console.warn('Transporter not initialized: EMAIL_USER or EMAIL_PASS missing.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '.')));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some hosted databases like Neon
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize Database Table
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT,
      customer_phone TEXT,
      product_name TEXT NOT NULL,
      location TEXT NOT NULL,
      colour TEXT NOT NULL,
      amount INTEGER NOT NULL,
      delivery_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    const client = await pool.connect();
    await client.query(queryText);
    
    // Check if columns exist (for backward compatibility)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
          ALTER TABLE orders ADD COLUMN customer_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN
          ALTER TABLE orders ADD COLUMN customer_phone TEXT;
        END IF;
      END $$;
    `);

    client.release();
    console.log('Database table "orders" is ready.');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

initDb();

// Function to send email notification
const sendOrderEmail = async (order) => {
  const notifyEmails = process.env.NOTIFY_EMAILS || 'folakemiomokafe242@gmail.com, abdulmumeenapata72@gmail.com';

  if (!transporter) {
    console.warn('Email notification skipped: Transporter not initialized.');
    return;
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: notifyEmails,
    subject: `New Order Received: ${order.product_name} from ${order.customer_name || 'Customer'}`,
    html: `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ff007f; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #ff007f; text-align: center;">New Order Notification</h2>
        <p>A new order has been placed on <strong>Oyin's Girlies Boutique</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;"><strong>Order ID:</strong></td><td style="padding: 8px 0;">#${order.id}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Customer Name:</strong></td><td style="padding: 8px 0;">${order.customer_name || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Phone Number:</strong></td><td style="padding: 8px 0;">${order.customer_phone || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Product:</strong></td><td style="padding: 8px 0;">${order.product_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Colour/Shade:</strong></td><td style="padding: 8px 0;">${order.colour}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Quantity:</strong></td><td style="padding: 8px 0;">${order.amount}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Delivery Location:</strong></td><td style="padding: 8px 0;">${order.location}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Delivery Date:</strong></td><td style="padding: 8px 0;">${new Date(order.delivery_date).toLocaleDateString()}</td></tr>
        </table>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 0.8rem; color: #999; text-align: center;">This is an automated notification from your website system.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order notification email sent.');
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.post('/api/orders', async (req, res) => {
  let { product, fullName, phone, location, colour, amount, date } = req.body;

  // Stricter Validation
  if (!product || !fullName || !phone || !location || !colour || !amount || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  amount = parseInt(amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  const queryText = 'INSERT INTO orders(customer_name, customer_phone, product_name, location, colour, amount, delivery_date) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  const values = [fullName, phone, product, location, colour, amount, date];

  try {
    const result = await pool.query(queryText, values);
    const savedOrder = result.rows[0];
    
    // Send email notification asynchronously
    sendOrderEmail(savedOrder);

    res.status(201).json({ 
      success: true,
      message: 'Order saved and notification sent!', 
      order: savedOrder 
    });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

// Catch-all middleware to serve index.html for any unhandled frontend routes
app.use((req, res) => {
  // If the request is for an API that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Otherwise, serve index.html for frontend routing
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
