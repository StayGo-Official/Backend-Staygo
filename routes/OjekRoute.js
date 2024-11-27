const express = require("express");
const {
    getOjek,
    getOjekById,
    createOjek,
    updateOjek,
    deleteOjek,
    getOjekMobile
} = require("../controllers/OjekController.js") 
const { verifyUser, adminOnly } = require("../middleware/AuthUser.js") 
const { verifyToken } = require("../middleware/VerifyToken.js");

const router = express.Router()

router.get('/ojek', getOjek)
router.get("/ojek-mobile", verifyToken, getOjekMobile)
router.get('/ojek/:id', getOjekById)
router.post('/ojek', verifyUser, adminOnly, createOjek)
router.patch('/ojek/:id', verifyUser, adminOnly, updateOjek)
router.delete('/ojek/:id', verifyUser, adminOnly, deleteOjek)

module.exports = router;