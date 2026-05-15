require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Database Table
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      product_name TEXT NOT NULL,
      location TEXT NOT NULL,
      colour TEXT NOT NULL,
      amount INTEGER NOT NULL,
      delivery_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Database table "orders" is ready.');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

initDb();

// Function to send email notification
const sendOrderEmail = async (order) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFY_EMAILS,
    subject: `New Order Received: ${order.product_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ff007f; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ff007f;">New Order Notification</h2>
        <p>A new order has been placed on <strong>Oyin's Girlies Boutique</strong>.</p>
        <hr>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Product:</strong> ${order.product_name}</p>
        <p><strong>Colour/Shade:</strong> ${order.colour}</p>
        <p><strong>Quantity:</strong> ${order.amount}</p>
        <p><strong>Delivery Location:</strong> ${order.location}</p>
        <p><strong>Preferred Delivery Date:</strong> ${order.delivery_date.toLocaleDateString()}</p>
        <hr>
        <p style="font-size: 0.8rem; color: #666;">This is an automated notification from your website.</p>
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
app.post('/api/orders', async (req, res) => {
  const { product, location, colour, amount, date } = req.body;

  if (!product || !location || !colour || !amount || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const queryText = 'INSERT INTO orders(product_name, location, colour, amount, delivery_date) VALUES($1, $2, $3, $4, $5) RETURNING *';
  const values = [product, location, colour, amount, date];

  try {
    const result = await pool.query(queryText, values);
    const savedOrder = result.rows[0];
    
    // Send email notification asynchronously
    sendOrderEmail(savedOrder);

    res.status(201).json({ message: 'Order saved and notification sent!', order: savedOrder });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
