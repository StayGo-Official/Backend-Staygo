const express = require("express");
const { getCustomers, Register, Login, Logout, getProfile, updateProfile, deleteCustomer, changePassword, sendVerificationCode, verifyEmail } = require("../controllers/CustomerController.js");
const { verifyToken } = require("../middleware/VerifyToken");
const refreshToken = require("../controllers/RefreshToken.js");
const router = express.Router();

router.get("/profile/:id", verifyToken, getProfile );
router.get('/customers', getCustomers);
router.patch('/update-profile/:id', verifyToken, updateProfile);
router.patch('/change-password/:id', verifyToken, changePassword);
router.post('/register-customer', Register);
router.post('/login-customer', Login);
router.post('/send-verification-code', verifyToken, sendVerificationCode);
router.post('/verify-email', verifyToken, verifyEmail);
router.get('/token', refreshToken);
router.delete('/logout-customer', verifyToken, Logout);
router.delete('/delete-customer/:id', deleteCustomer);

module.exports = router;