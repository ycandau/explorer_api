//------------------------------------------------------------------------------
// File list routes
//------------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

router.get('/ls', (req, res) => {
  res.json({ files: ['a.md'] });
});

module.exports = router;
