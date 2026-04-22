const { getPool } = require('./init');

async function migrate() {
    const pool = await getPool();
    console.log('Running HR Role Integration Migration...');
    try {
        // Drop existing constraint if exists
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK__users__role__267ABA7A')
            ALTER TABLE users DROP CONSTRAINT CK__users__role__267ABA7A;
            
            IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = object_id('users') AND definition LIKE '%HR_ADMIN%')
            BEGIN
                DECLARE @ConstraintName nvarchar(200)
                SELECT @ConstraintName = Name FROM sys.check_constraints WHERE parent_object_id = object_id('users') AND definition LIKE '%HR_ADMIN%'
                EXEC('ALTER TABLE users DROP CONSTRAINT ' + @ConstraintName)
            END
        `);
        
        // Update existing roles
        await pool.request().query(`
            UPDATE users SET role = 'HR' WHERE role IN ('HR_ADMIN', 'HR_REVIEWER');
        `);

        // Add new constraint
        await pool.request().query(`
            ALTER TABLE users ADD CONSTRAINT CK_users_role CHECK (role IN ('NEW_HIRE', 'HR', 'IT_ADMIN'));
        `);

        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
