//------------------------------------------------------------------------------
// File list routes
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

const getTreeData = require('../helpers/fs');

const [nodePath, filePath, ...dirPaths] = process.argv;

const tree = {
  root: dirPaths[0],
  expandedDirs: [],
};

router.get('/ls', async (req, res) => {
  const data = await getTreeData(tree);
  res.json(data);
});

module.exports = router;
