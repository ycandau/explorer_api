//------------------------------------------------------------------------------
// file-explorer.js
//------------------------------------------------------------------------------

require('dotenv').config();
const PORT = process.env.PORT || 8000;

// Create and initialize the server
const express = require('express');
const app = express();

// Log the server
const morgan = require('morgan');
app.use(morgan('dev'));

// Parse the body
app.use(express.json({ extended: false }));

//------------------------------------------------------------------------------
// Asynchronous initialization

const init = async () => {
  // Websocket
  const http = require('http');
  const server = http.Server(app);

  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.onmessage = () => console.log(`WebSocket connected`);
  });

  // State
  const { initState } = require('./src/state');
  const state = await initState(process.argv.slice(2), wss);

  // Router
  const router = require('./routes/api')(state);
  app.use('/api', router);

  //----------------------------------------------------------------------------

  // Listen
  server.listen(PORT, () =>
    console.log(`
-------------------------------
Explorer listening on port ${PORT}
-------------------------------`)
  );
};

init();
