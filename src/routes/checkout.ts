import express from "express"
import { checkout } from "../services/order.service"

const router = express.Router()

router.post("/:userId", (req,res) => {
    try{
        const userId = req.params.userId
        const {couponCode = null} = req.body

        const order = checkout(userId, couponCode)

        res.json({
            success: true,
            message: "order checkout successfully",
            data: order
        })
    }catch (e) {
        const error =  e as {status: number, message: string}
        res.status(error.status ?? 500).json({
            success: false,
            message: error.message || "internal server error"
        })
    }
})


export default router