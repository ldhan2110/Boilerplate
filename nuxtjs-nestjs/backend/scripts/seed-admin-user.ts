import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1111';
const TENANT_ID = 'CLV';
const TENANT_NAME = 'CLV';

async function seedAdminUser() {
  // Main database connection
  const mainDB = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [],
  });

  // Metadata database connection
  const metadataDB = new DataSource({
    type: 'postgres',
    host: process.env.METADATA_DB_HOST,
    port: parseInt(process.env.METADATA_DB_PORT || '5432'),
    username: process.env.METADATA_DB_USERNAME,
    password: process.env.METADATA_DB_PASSWORD,
    database: process.env.METADATA_DB_NAME,
    entities: [],
  });

  try {
    // Initialize connections
    await mainDB.initialize();
    await metadataDB.initialize();

    console.log('✓ Database connections established');

    // 1. Create tenant in metadata DB
    console.log(`\n→ Creating tenant "${TENANT_ID}"...`);
    const tenantExists = await metadataDB.query(
      `SELECT 1 FROM tenant.tent_mst WHERE tent_id = $1`,
      [TENANT_ID],
    );

    if (tenantExists.length === 0) {
      await metadataDB.query(
        `INSERT INTO tenant.tent_mst (tent_id, tent_nm, use_flg, tent_crnt_ver, cre_usr_id, upd_usr_id)
         VALUES ($1, $2, 'Y', '0001', 'system', 'system')`,
        [TENANT_ID, TENANT_NAME],
      );
      console.log(`✓ Tenant "${TENANT_ID}" created`);
    } else {
      console.log(`✓ Tenant "${TENANT_ID}" already exists`);
    }

    // 2. Create user in main DB
    console.log(`\n→ Creating user "${ADMIN_USERNAME}"...`);
    const userExists = await mainDB.query(
      `SELECT 1 FROM adm_usr WHERE usr_id = $1`,
      [ADMIN_USERNAME],
    );

    if (userExists.length === 0) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const now = new Date();

      await mainDB.query(
        `INSERT INTO adm_usr (usr_id, usr_nm, usr_pwd, use_flg, cre_usr_id, upd_usr_id, cre_dt, upd_dt)
         VALUES ($1, $2, $3, true, 'system', 'system', $4, $5)`,
        [ADMIN_USERNAME, 'Admin User', hashedPassword, now, now],
      );
      console.log(`✓ User "${ADMIN_USERNAME}" created`);
      console.log(`  Password: "${ADMIN_PASSWORD}"`);
    } else {
      console.log(`✓ User "${ADMIN_USERNAME}" already exists`);
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`\nTest credentials:`);
    console.log(`  Username: ${ADMIN_USERNAME}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Tenant ID: ${TENANT_ID}`);
    console.log(`\nLogin endpoint: POST /auth/login`);
    console.log(`Request body:`);
    console.log(JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      tenantId: TENANT_ID,
    }, null, 2));

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mainDB.destroy();
    await metadataDB.destroy();
  }
}

seedAdminUser();
