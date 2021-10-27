//------------------------------------------------------------------------------
// File list routes
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const getTrees = require('../helpers/fs');

const [nodePath, filePath, ...dirPaths] = process.argv;

const roots = dirPaths.map((path) => ({
  name: path,
  path: '.',
  expandedDirs: [],
}));

router.get('/trees', async (req, res) => {
  const data = await getTrees(roots);
  res.json(data);
});

module.exports = router;
