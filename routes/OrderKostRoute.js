const express = require("express");
const {
    getOrderKost,
    getOrderKostById,
    createOrderKost,
    deleteOrderKost,
} = require("../controllers/OrderKostController.js") 

const { verifyToken } = require("../middleware/VerifyToken.js");
const { verifyUser, adminOnly } = require("../middleware/AuthUser.js")

const router = express.Router()

router.get('/order-kost-admin', verifyUser, adminOnly, getOrderKost)
router.get('/order-kost', verifyToken, getOrderKost)
router.get('/order-kost/:id', getOrderKostById)
router.post('/order-kost', verifyToken, createOrderKost)
router.delete('/order-kost/:id', verifyToken, deleteOrderKost)

module.exports = router;