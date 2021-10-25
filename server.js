//------------------------------------------------------------------------------
// server.js
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Load .env data

require('dotenv').config();

//------------------------------------------------------------------------------
// Constants

const PORT = process.env.PORT || 3000;

//------------------------------------------------------------------------------
// Create and initialize server

const express = require('express');
const app = express();

//------------------------------------------------------------------------------
// Use middleware

// Log server
const morgan = require('morgan');
app.use(morgan('dev'));

// Parse body
app.use(express.urlencoded({ extended: false }));

//------------------------------------------------------------------------------
// Create routers and mount

app.use('/', require('./routes/ls'));

//------------------------------------------------------------------------------
// Start listening

app.listen(PORT, () =>
  console.log(`
-------------------------------
Explorer listening on port ${PORT}
-------------------------------`)
);
