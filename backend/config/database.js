// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('MONGODB_URI_ML:', process.env.MONGODB_URI_ML);
    console.log('MONGODB_DB_ML:', process.env.MONGODB_DB_ML || 'project_1');

    // Main (URI already contains DB name)
    const mainConn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Main MongoDB Connected: host=${mainConn.connection.host} db=${mainConn.connection.name}`);

    // ML: create a *separate* connection and wait for it
    const mlConn = mongoose.createConnection(process.env.MONGODB_URI_ML, {
      dbName: process.env.MONGODB_DB_ML || 'project_1',
    });
    await mlConn.asPromise(); // <-- this is the important part

    // Better diagnostics
    console.log(`ML MongoDB Connected: host=${mlConn.host || '(n/a)'} db=${mlConn.name} readyState=${mlConn.readyState}`);

    // Make available globally if you prefer that pattern
    global.mlConnection = mlConn;

    return { mainConn: mainConn.connection, mlConn };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

module.exports = connectDB;
