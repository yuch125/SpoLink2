// GET /applications?username=XXX
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

router.get('/', async (req, res) => {
  const { username } = req.query;
  try {
    const applications = await Application.find({ username }).populate('post');
    res.json(applications);
  } catch (err) {
    console.error('❌ applications GET 에러:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
