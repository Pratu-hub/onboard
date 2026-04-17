const app = require('./app');
const { initDatabase } = require('./db/init');

const PORT = process.env.PORT || 3001;

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
    });
  } catch (err) {
    console.error('💥 Failed to start server:', err.message);
    console.error('\nTip: Make sure your Azure SQL Database credentials are set in backend/.env');
    process.exit(1);
  }
}

start();
