import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1111';
const TENANT_ID = 'CLV';
const TENANT_NAME = 'Cyberlogitec Vietnam';

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
      // 1.0 Insert tenant master record
      await metadataDB.query(
        `INSERT INTO tenant.tent_mst (tent_id, tent_nm, use_flg, tent_crnt_ver, cre_usr_id, upd_usr_id)
         VALUES ($1, $2, 'Y', '1.0', 'system', 'system')`,
        [TENANT_ID, TENANT_NAME],
      );
      console.log(`✓ Tenant "${TENANT_ID}" created`);

      // 1.1 Insert tenant database information
      await metadataDB.query(
        `INSERT INTO tenant.tent_db_cfg (tent_id, db_tp_cd, db_host, db_port, db_nm, db_usr_nm, db_pwd, use_flg, cfg_nm, cre_usr_id, cre_dt, upd_usr_id, upd_dt)
         VALUES ($1, $9, $2, $3, $4, $5, $6, $7, $8, 'system', now(), 'system', now())`,
        [
          TENANT_ID,
          process.env.DB_HOST,
          parseInt(process.env.DB_PORT || '5432'),
          process.env.DB_NAME,
          process.env.DB_USERNAME,
          process.env.DB_PASSWORD,
          'Y',
          'Default Config DB',
          'postgres',
        ],
      );
      console.log(`✓ Tenant DB Config "${TENANT_ID}" created`);

      // 1.2 Insert tenant application information
      await mainDB.query(
        `INSERT INTO adm_co (co_id, co_nm, use_flg, cre_usr_id, cre_dt, upd_usr_id, upd_dt, tm_zn)
         VALUES ($1, $2, 'Y', 'SYSTEM', now(), 'system', now(), 'Asia/Ho_Chi_Minh')`,
        [TENANT_ID, TENANT_NAME],
      )
      console.log(`✓ Tenant application info for "${TENANT_ID}" inserted`);
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
        `INSERT INTO adm_usr (co_id, usr_id, usr_nm, usr_pwd, use_flg, cre_usr_id, upd_usr_id, cre_dt, upd_dt)
         VALUES ($6, $1, $2, $3, true, 'system', 'system', $4, $5)`,
        [ADMIN_USERNAME, 'Admin User', hashedPassword, now, now, TENANT_ID],
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
