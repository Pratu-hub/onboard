const app = require('./app');
const { initDatabase } = require('./db/init');

const PORT = process.env.PORT || 3001;

async function recoverStuckDocuments() {
  try {
    const { getPool } = require('./db/init');
    const { generateReadSasUrl } = require('./utils/firebaseStorage');
    const { processDocumentWithAI } = require('./utils/aiProcessor');

    const pool = await getPool();
    const stuck = await pool.request().query(`
      SELECT id, doc_type, filename 
      FROM documents 
      WHERE status = 'ai_processing' AND filename IS NOT NULL
    `);
    
    if (stuck.recordset.length > 0) {
      console.log(`\n🔄 [AI-RECOVERY] Found ${stuck.recordset.length} stuck documents. Restarting analysis...`);
      for (const doc of stuck.recordset) {
        try {
          const viewUrl = await generateReadSasUrl(doc.filename, 30);
          // Fire-and-forget so it doesn't block startup
          processDocumentWithAI(doc.id, viewUrl, doc.doc_type).catch(e => 
            console.error(`[AI-RECOVERY] Failed to process doc ${doc.id}:`, e.message)
          );
        } catch(e) {
          console.error(`[AI-RECOVERY] Failed to generate URL for doc ${doc.id}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ [AI-RECOVERY] Startup check failed (can be ignored):', err.message);
  }
}

async function start() {
  try {
    // Initialize database schema
    await initDatabase();
    console.log('📦 Database ready');

    // Initialize Blob Storage
    const { initializeContainer } = require('./utils/firebaseStorage');
    await initializeContainer();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 OnboardIQ API running at http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
      
      // Run recovery in background after server is up
      recoverStuckDocuments();
    });
  } catch (err) {
    console.error('💥 Failed to start server:', err.message);
    console.error('\nTip: Make sure your Azure SQL Database credentials are set in backend/.env');
    process.exit(1);
  }
}

start();
