import express from "express"
import { checkout } from "../services/order.service"

const router = express.Router()

router.post("/:userId", (req, res) => {
    const userId = req.params.userId
    const { couponCode = null } = req.body

    const order = checkout(userId, couponCode)

    res.json({
        success: true,
        message: "order checkout successfully",
        data: order
    })
})


export default router