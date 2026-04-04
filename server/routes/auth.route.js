const express = require('express');
const {login, forgotPassword, resetPassword, logout} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);


module.exports = router;
