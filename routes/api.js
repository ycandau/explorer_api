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

  router.put('/', async (req, res) => {
    console.log(req.body);
    res.send();
  });

  return router;
};
