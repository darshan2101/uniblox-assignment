import { store } from "../store/store"
import { grantRewardIfEligible, markUsed, validateCoupon } from "./coupon.service"

export function checkout(userId: string, couponCode?: string){
    const cart = store.carts.get(userId)
    if (!cart || cart.items.length === 0) {
        throw { status: 400 , message: "cart is empty" }
    }
    let subtotal = 0
    cart.items.forEach(item => {
        const product = store.products.get(item.productId)
        if (!product) {
            throw { status: 404, message: `product not found: ${item.productId}` }
        }
        const pricePerProduct = product.price * item.quantity
        subtotal += pricePerProduct
    })
    let discountPercent =  0
    if (couponCode) {
        const coupon = validateCoupon(couponCode)
        discountPercent = coupon.discountPct 
    }
    const discountAmount =  subtotal * (discountPercent / 100)
    const total = subtotal - discountAmount
    
    const orderId =`o${++store.orderSeq}`
    const order = { id: orderId, userId: userId, items: [...cart.items], subtotal: subtotal, discountAmount: discountAmount, total: total, couponUsed: couponCode ?? null, createdAt: new Date() }

    store.orders.push(order)

    if (couponCode) {
        markUsed(couponCode, orderId)
    }
    
    store.carts.delete(userId)
    const rewardCoupon = grantRewardIfEligible()

    return { order,rewardCoupon }
}