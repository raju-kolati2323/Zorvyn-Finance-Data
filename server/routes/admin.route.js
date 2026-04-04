const express = require('express');
const {registerNewUser, getallUsers, updateUserDetailsById, getUserById, createRecord, updateRecordById, deleteRecordById} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { getRecordById, filterRecords, getRecords } = require('../controllers/common.controller');

const router = express.Router();

router.post('/register', protect, registerNewUser);
router.get('/users', protect, getallUsers);
router.get("/user/:id", protect, getUserById);
router.patch("/update-user/:id", protect, updateUserDetailsById);

router.post("/create-record", protect, createRecord);
router.get("/records/:id?", protect, getRecords);
router.get("/record/:id", protect, getRecordById);
router.get("/filter-records", protect, filterRecords);
router.patch("/update-record/:id", protect, updateRecordById);
router.delete("/delete-record/:id", protect, deleteRecordById);

module.exports = router;
