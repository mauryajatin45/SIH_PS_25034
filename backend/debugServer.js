// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');

// const app = express();
// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/udaan')
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.log('MongoDB Error:', err));

// // Simple test route
// app.get('/health', (req, res) => {
//   res.json({ success: true, message: 'Server is running' });
// });

// // Test candidates route directly in app.js
// app.post('/api/candidates/debug', (req, res) => {
//   console.log('Debug route hit! Body:', req.body);
//   res.json({ 
//     success: true, 
//     message: 'Debug route works!',
//     receivedData: req.body
//   });
// });

// // Test if the main candidates route exists
// app.post('/api/candidates', (req, res) => {
//   console.log('Direct candidates route hit! Body:', req.body);
//   res.json({ 
//     success: true, 
//     message: 'Direct candidates route works!',
//     receivedData: req.body
//   });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Debug server running on port ${PORT}`);
// });