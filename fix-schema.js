import { pool } from './src/config/db.js';

async function fixDatabaseSchema() {
  try {
    console.log('🔍 Checking current products table schema...');

    const [columns] = await pool.query('DESCRIBE products');
    console.log('📋 Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // Check if we need to add new columns
    const hasThumb = columns.some(col => col.Field === 'thumb_image_path');
    const hasDetail = columns.some(col => col.Field === 'detail_image_path');

    if (!hasThumb) {
      console.log('➕ Adding thumb_image_path column...');
      await pool.query('ALTER TABLE products ADD COLUMN thumb_image_path VARCHAR(255)');
    }

    if (!hasDetail) {
      console.log('➕ Adding detail_image_path column...');
      await pool.query('ALTER TABLE products ADD COLUMN detail_image_path VARCHAR(255)');
    }

    console.log('✅ Database schema updated successfully!');
    console.log('🎉 Your product image system is now ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

fixDatabaseSchema();
