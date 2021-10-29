//------------------------------------------------------------------------------
// Router
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const { updateRoot, deleteRoot } = require('../src/state');
const getTrees = require('../src/fs');

module.exports = (state) => {
  router.get('/', async (_, res) => {
    const data = await getTrees(state.roots);
    res.json(data);
  });

  router.put('/', async (req, res) => {
    const root = req.body;
    await updateRoot(state, root);
    const data = await getTrees(state.roots);
    res.json(data);
  });

  router.delete('/:rootId', async (req, res) => {
    const rootId = Number(req.params.rootId);
    await deleteRoot(state, rootId);
    const data = await getTrees(state.roots);
    res.json(data);
  });

  return router;
};
