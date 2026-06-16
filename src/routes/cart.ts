import { addItem, getCart, removeItem } from "../services/cart.service"
import express from "express"

const router = express.Router()

router.get("/:userId", (req, res) => {
    const userId = req.params.userId
    const cart = getCart(userId)

    res.json({
        success: true,
        message: "cart retrieved successfully",
        data: cart
    })
})

router.post("/:userId/items", (req, res) => {
    const userId = req.params.userId
    const { productId, quantity } = req.body

    if (typeof productId !== "string" || !productId) {
        throw { status: 400, message: "productId is required" }
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw { status: 400, message: "quantity must be a positive integer" }
    }

    const cart = addItem(userId, productId, quantity)
    res.json({
        success: true,
        message: "item added to cart successfully",
        data: cart
    })
})

router.delete("/:userId/items/:productId", (req, res) => {
    const { userId, productId } = req.params
    const cart = removeItem(userId, productId)

    res.json({
        success: true,
        message: "item removed from cart successfully",
        data: cart
    })
})

export default router