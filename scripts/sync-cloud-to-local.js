/**
 * Sync Cloud-to-Local
 * Exporta datos de Aiven (cloud) y los importa a MySQL local
 * 
 * Uso: node scripts/sync-cloud-to-local.js
 * 
 * Requiere:
 *  - .env con credenciales de Aiven (DB_HOST=aiven...)
 *  - MySQL local corriendo en localhost:3306
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Cloud config (Aiven)
const cloudConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'epp_inventory',
  ssl: String(process.env.DB_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: true } : undefined
};

// Local config
const localConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: process.env.LOCAL_DB_PASSWORD || '',
  database: 'epp_inventory'
};

const TABLES = [
  'roles',
  'users',
  'periods',
  'epp_types',
  'sizes',
  'epp_type_sizes',
  'workers',
  'user_preferences',
  'clean_inventory_initial_stock',
  'physical_inventories',
  'incomes',
  'deliveries',
  'returns',
  'laundry_movements',
  'inventory_movements',
  'inventory_adjustments',
  'audit_logs'
];

async function exportFromCloud() {
  console.log('☁️  Conectando a Aiven (cloud)...');
  const conn = await mysql.createConnection(cloudConfig);
  console.log('✅ Conexión a Aiven exitosa');

  const data = {};
  for (const table of TABLES) {
    try {
      const [rows] = await conn.query(`SELECT * FROM \`${table}\` ORDER BY id`);
      data[table] = rows;
      console.log(`   📦 ${table}: ${rows.length} registros`);
    } catch (err) {
      console.log(`   ⚠️  ${table}: ${err.message}`);
      data[table] = [];
    }
  }

  await conn.end();
  return data;
}

async function importToLocal(data) {
  console.log('\n💻 Conectando a MySQL local...');
  const conn = await mysql.createConnection(localConfig);
  console.log('✅ Conexión local exitosa');

  // Create database if not exists
  await conn.query('CREATE DATABASE IF NOT EXISTS epp_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.query('USE epp_inventory');

  // Disable foreign key checks for import
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  // Truncate and import each table
  for (const table of TABLES) {
    const rows = data[table] || [];
    if (rows.length === 0) {
      console.log(`   ⏭️  ${table}: vacía, saltando`);
      continue;
    }

    try {
      // Truncate table
      await conn.query(`TRUNCATE TABLE \`${table}\``);

      if (rows.length === 0) continue;

      // Get column names from first row
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const insertSQL = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

      // Insert rows in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        for (const row of batch) {
          const values = columns.map(col => row[col]);
          await conn.query(insertSQL, values);
        }
      }

      console.log(`   ✅ ${table}: ${rows.length} registros importados`);
    } catch (err) {
      console.log(`   ❌ ${table}: Error - ${err.message}`);
    }
  }

  // Re-enable foreign key checks
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  await conn.end();
}

function saveBackup(data) {
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-cloud-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  console.log(`\n💾 Backup guardado en: ${backupFile}`);
}

async function main() {
  console.log('🔄 ==========================================');
  console.log('   SYNC: Aiven (Cloud) → MySQL Local');
  console.log('============================================\n');

  try {
    // 1. Export from cloud
    const data = await exportFromCloud();

    // 2. Save backup
    saveBackup(data);

    // 3. Import to local
    await importToLocal(data);

    console.log('\n✅ ==========================================');
    console.log('   ¡Sincronización completada exitosamente!');
    console.log('============================================');
    console.log('\n📊 Resumen:');

    let totalRecords = 0;
    for (const table of TABLES) {
      const count = (data[table] || []).length;
      totalRecords += count;
      if (count > 0) {
        console.log(`   ${table}: ${count}`);
      }
    }
    console.log(`\n   Total: ${totalRecords} registros sincronizados`);

  } catch (err) {
    console.error('\n❌ Error durante la sincronización:', err.message);
    process.exit(1);
  }
}

main();
