import { store } from "../store/store"
import { grantRewardIfEligible } from "./coupon.service"

export function getStats(){
    const orders = store.orders
    // sum total items purchased across orders

    const totalItemsPurchased = orders.reduce((total , order) => {
        total += order.items.reduce((sum, item)=>  sum += item.quantity , 0)
        return total
    }, 0)

    const totalDiscountAmount = orders.reduce((totalDiscount, order) => totalDiscount += order.discountAmount, 0)
    const totalPurchaseAmount = orders.reduce((total, order) => total += order.total, 0)
    const discountCodes = [...store.coupons.values()]
    
    return {
        totalItemsPurchased,
        totalDiscountAmount,
        totalPurchaseAmount,
        discountCodes
    }
}

export function generateAdminCoupon(){
    const coupon = grantRewardIfEligible()
    if(!coupon) throw { status: 400, message: "no reward available: nth-order condition not met" }
    return coupon
}