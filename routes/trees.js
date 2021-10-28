//------------------------------------------------------------------------------
// Router
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const getTrees = require('../src/fs');

module.exports = (state) => {
  router.get('/', async (req, res) => {
    const data = await getTrees(state.roots);
    res.json(data);
  });

  return router;
};
