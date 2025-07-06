// GET /applications?userId=XXX
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

router.get('/', async (req, res) => {
  const { userId } = req.query; // ✅ username → userId

  try {
    const applications = await Application.find({ 'applicant.userId': userId }).populate('post');
    res.json(applications);
  } catch (err) {
    console.error('❌ applications GET 에러:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
