import express from "express"
import { getStats, generateAdminCoupon } from "../services/admin.service"

const router = express.Router()

router.get("/stats", (req,res) => {
    try {
        const stats = getStats()
        res.json({
            success: true,
            message: "stats retrieved successfully",
            data: stats
        })
    } catch (e) {
        const error = e as {status: number, message: string}
        res.status(error.status ?? 500).json({
            success: false,
            message: error.message ?? "internal server error"
        })
    }
})

router.post("/coupons/generate", (req,res) => {
    try {
        const coupon = generateAdminCoupon()
        res.status(201).json({
            success: true,
            message: "coupon generated successfully",
            data: coupon
        })
    } catch (e) {
        const error = e as {status: number, message: string}
        res.status(error.status ?? 500).json({
            success: false,
            message: error.message ?? "internal server error"
        })
    }
})



export default router