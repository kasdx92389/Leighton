// โหลด library ที่จำเป็น
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

// ตั้งค่า Express App
const app = express();
const port = process.env.PORT || 3001; // ใช้ Port จาก Render หรือ 3001 ถ้าทดสอบในเครื่อง

// Middleware ที่ต้องใช้
app.use(cors()); // อนุญาตการเชื่อมต่อจากโดเมนอื่น
app.use(express.json()); // ทำให้ Express อ่านข้อมูล JSON จาก request body ได้
app.use(express.static(path.join(__dirname, 'public'))); // บอกให้ Express รู้จักโฟลเดอร์ public

// ตั้งค่าการเชื่อมต่อฐานข้อมูลสำหรับ Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

// ----- API Endpoint: เพิ่มออเดอร์ใหม่ (CREATE) -----
app.post('/api/orders', async (req, res) => {
    try {
        const {
            order_id, total_amount, payment_proof_link, platform,
            customer_name, game_name, product_id, quantity,
            package_details, cost, status, sales_proof_link,
            agent_name, top_up_channel, notes
        } = req.body;

        const profit = total_amount && cost ? parseFloat(total_amount) - parseFloat(cost) : null;

        const newOrder = await pool.query(
            `INSERT INTO orders (
                order_id, total_amount, payment_proof_link, platform, customer_name, game_name, product_id,
                quantity, package_details, cost, profit, status, sales_proof_link, agent_name, top_up_channel, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                order_id, total_amount, payment_proof_link, platform, customer_name, game_name, product_id,
                quantity, package_details, cost, profit, status || 'รอดำเนินการ', sales_proof_link, agent_name, top_up_channel, notes
            ]
        );

        res.status(201).json(newOrder.rows[0]);
    } catch (err) {
        console.error('Error creating order:', err.message);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// ----- API Endpoint: ดึงข้อมูลออเดอร์ทั้งหมด (READ) -----
app.get('/api/orders', async (req, res) => {
    try {
        const allOrders = await pool.query('SELECT * FROM orders ORDER BY transaction_datetime DESC');
        res.json(allOrders.rows);
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// Endpoint หลักสำหรับแสดงหน้าเว็บ
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// เริ่มรันเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`เซิร์ฟเวอร์กำลังทำงานที่ Port ${port}`);
});