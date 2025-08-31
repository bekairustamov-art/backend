const mysql = require('mysql2/promise');
require('dotenv').config();

async function createInfoTable() {
  let conn;

  try {
    console.log('🔧 Connecting to database...');

    conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      database: process.env.MYSQL_DATABASE || 'ecommerce',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    });

    console.log('✅ Connected to database');

    // Create the info table
    console.log('📝 Creating info table...');
    const createTableSQL = `CREATE TABLE IF NOT EXISTS info (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;

    await conn.query(createTableSQL);
    console.log('✅ Info table created successfully');

    // Insert default record
    console.log('📝 Inserting default record...');
    const defaultData = JSON.stringify({ socials: {}, description: "" });
    await conn.query(
      'INSERT INTO info (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [defaultData]
    );
    console.log('✅ Default info record inserted');

    // Verify
    const [tables] = await conn.query('SHOW TABLES LIKE "info"');
    if (tables.length > 0) {
      console.log('✅ SUCCESS: Info table exists and is ready');
    } else {
      console.log('❌ FAILED: Info table still does not exist');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

createInfoTable();
