const express = require("express");
const {
    getOrderOjek,
    getOrderOjekById,
    createOrderOjek,
    deleteOrderOjek,
} = require("../controllers/OrderOjekController.js") 

const { verifyToken } = require("../middleware/VerifyToken.js");

const router = express.Router()

router.get('/order-ojek', verifyToken, getOrderOjek)
router.get('/order-ojek/:id', getOrderOjekById)
router.post('/order-ojek', verifyToken, createOrderOjek)
router.delete('/order-ojek/:id', verifyToken, deleteOrderOjek)

module.exports = router;