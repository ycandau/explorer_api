//------------------------------------------------------------------------------
// Router
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const { updateRoot } = require('../src/state');
const getTrees = require('../src/fs');

module.exports = (state) => {
  router.get('/', async (_, res) => {
    const data = await getTrees(state.roots);
    res.json(data);
  });

  router.put('/', async (req, res) => {
    const root = req.body;
    updateRoot(state, root);
    const data = await getTrees(state.roots);
    res.json(data);
  });

  return router;
};
