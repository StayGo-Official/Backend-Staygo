const express = require("express");
const {
    getOrderOjek,
    getOrderOjekById,
    createOrderOjek,
    updateStatusSuccessOrderOjek,
    updateStatusFailOrderOjek,
    deleteOrderOjek,
} = require("../controllers/OrderOjekController.js") 

const { verifyToken } = require("../middleware/VerifyToken.js");

const router = express.Router()

router.get('/order-ojek', verifyToken, getOrderOjek)
router.get('/order-ojek/:id', getOrderOjekById)
router.post('/order-ojek', verifyToken, createOrderOjek)
router.patch('/order-ojek-success/:id', verifyToken, updateStatusSuccessOrderOjek)
router.patch('/order-ojek-fail/:id', verifyToken, updateStatusFailOrderOjek)
router.delete('/order-ojek/:id', verifyToken, deleteOrderOjek)

module.exports = router;