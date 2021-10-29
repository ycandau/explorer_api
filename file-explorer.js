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
// app.use(express.urlencoded({ extended: false }));
app.use(express.json({ extended: false }));

//------------------------------------------------------------------------------
// Asynchronous initialization

const init = async () => {
  // State
  const { initState } = require('./src/state');
  const state = await initState(process.argv.slice(2));

  // Router
  const router = require('./routes/api')(state);
  app.use('/api', router);

  //----------------------------------------------------------------------------

  const http = require('http');

  const server = http.Server(app);
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.onmessage = (event) => {
      console.log(`Message Received: ${event.data}`);

      if (event.data === 'ping') {
        ws.send(JSON.stringify('pongo'));
      }
    };
  });

  // function updateAppointment(id, interview) {
  //   wss.clients.forEach(function eachClient(client) {
  //     if (client.readyState === WebSocket.OPEN) {
  //       client.send(
  //         JSON.stringify({
  //           type: 'SET_INTERVIEW',
  //           id,
  //           interview,
  //         })
  //       );
  //     }
  //   });
  // }

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
