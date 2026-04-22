const { getPool } = require('./init');

async function migrate() {
    const pool = await getPool();
    console.log('Running audit_logs migration...');
    try {
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
            CREATE TABLE audit_logs (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_id INT NOT NULL,
                reviewer_name NVARCHAR(255),
                action_type NVARCHAR(50) NOT NULL,
                notes NVARCHAR(MAX),
                created_at DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
