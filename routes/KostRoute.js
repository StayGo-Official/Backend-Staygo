const express = require("express");
const {
    getKost,
    getKostById,
    createKost,
    updateKost,
    deleteKost,
    allKost
} = require("../controllers/KostController.js") 
const { verifyUser, adminOnly } = require("../middleware/AuthUser.js") 

const router = express.Router()

router.get('/kost', getKost)
router.get("/kost-mobile", allKost)
router.get('/kost/:id', getKostById)
router.post('/kost', verifyUser, adminOnly, createKost)
router.patch('/kost/:id', verifyUser, adminOnly, updateKost)
router.delete('/kost/:id', verifyUser, adminOnly, deleteKost)

module.exports = router;