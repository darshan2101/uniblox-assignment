import {addItem, getCart, removeItem} from "../services/cart.service"
import express from "express"

const router = express.Router()

router.get("/:userId", (req, res) => {
    try{
        const userId = req.params.userId
        const cart = getCart(userId)
        res.json({
            success: true,
            message: "cart retrieved successfully",
            data: cart
        })
    }catch(e) {
        const error = e as { status?: number, message?: string }
        res.status(error.status ?? 500).json({
            success: false,
            message: error.message ?? "internal server error"
        })
    }
})

router.post("/:userId/items", (req, res) => {
    const userId = req.params.userId
    const { productId, quantity } = req.body
    try{
        const cart = addItem(userId, productId, quantity)
        res.json({
            success: true,
            message: "item added to cart successfully",
            data: cart
        })
    }catch(e) {
        const error = e as { status?: number, message?: string }
        res.status(error.status ?? 500).json({
            success: false,
            message: error.message ?? "internal server error"
        })
    }
})

router.delete("/:userId/items/:productId", (req, res) => {
    try{
        const {userId, productId} = req.params
        const cart = removeItem(userId, productId)
        res.json({
            success: true,
            message: "item removed from cart successfully",
            data: cart
        })
    }catch(e) {
        const error = e as { status?: number, message?: string }
        res.status(error.status ?? 500).json({
            success: false,
            message: error.message ?? "internal server error"
        })
    }
})

export default router