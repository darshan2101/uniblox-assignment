import express from "express"
import { getStats, generateAdminCoupon } from "../services/admin.service"

const router = express.Router()

router.get("/stats", (req, res) => {
    const stats = getStats()
    res.json({
        success: true,
        message: "stats retrieved successfully",
        data: stats
    })
})

router.post("/coupons/generate", (req, res) => {
    const coupon = generateAdminCoupon()
    res.status(201).json({
        success: true,
        message: "coupon generated successfully",
        data: coupon
    })
})

export default router