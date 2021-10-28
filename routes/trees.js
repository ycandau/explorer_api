//------------------------------------------------------------------------------
// File list routes
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const { resolve, dirname, basename } = require('path');

const getTrees = require('../src/fs');

const [nodePath, filePath, ...dirPaths] = process.argv;

const roots = dirPaths.map((path) => {
  const resolvedPath = resolve(path);
  return {
    name: basename(resolvedPath),
    path: dirname(resolvedPath),
    expandedDirs: [],
  };
});

router.get('/trees', async (req, res) => {
  const data = await getTrees(roots);
  res.json(data);
});

module.exports = router;
