const express = require('express');

const { protect } = require('../middleware/auth.middleware');
const { getProfile, getRecords, getRecordById, filterRecords, getDashboardSummary } = require('../controllers/common.controller');

const router = express.Router();

router.get("/profile", protect, getProfile);

router.get("/records/:id?", protect, getRecords);
router.get("/record/:id", protect, getRecordById);
router.get("/filter-records", protect, filterRecords);
router.get("/dashboard-summary", protect, getDashboardSummary);

module.exports = router;