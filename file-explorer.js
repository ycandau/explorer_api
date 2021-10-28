//------------------------------------------------------------------------------
// file-explorer.js
//------------------------------------------------------------------------------

require('dotenv').config();
const PORT = process.env.PORT || 3000;

// Create and initialize the server
const express = require('express');
const app = express();

// Log the server
const morgan = require('morgan');
app.use(morgan('dev'));

// Parse the body
app.use(express.urlencoded({ extended: false }));

//------------------------------------------------------------------------------
// Asynchronous initialization

const init = async () => {
  // State
  const { initState } = require('./src/state');
  const state = await initState(process.argv.slice(2));

  // Router
  const router = require('./routes/trees')(state);
  app.use('/api', router);

  // Listen
  app.listen(PORT, () =>
    console.log(`
-------------------------------
Explorer listening on port ${PORT}
-------------------------------`)
  );
};

init();
