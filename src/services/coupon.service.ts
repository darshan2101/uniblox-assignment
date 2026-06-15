import {store} from "../store/store"


export function generateCoupon(discountPct?: number) {
    const code = `DISC-${++store.couponSeq}`
    const discount = discountPct ?? store.config.rewardDiscountPct
    const coupon = { code, discountPct: discount, usedInOrderId: null }
    store.coupons.set(code, coupon)
    return coupon
}

export function isEligible() {
    const count = store.orders.length
    const lastRewardedOrderCount = store.config.lastRewardedOrderCount
    const nthOrder = store.config.nthOrder

    return (count > 0) && (count % nthOrder === 0) && (count !== lastRewardedOrderCount)
}

export function validateCoupon(code: string) {
    const coupon = store.coupons.get(code)
    if (!coupon) {
        throw { status: 400, message: "invalid coupon" }
    }
    if (coupon.usedInOrderId) {
        throw { status: 400, message: "coupon already used" }
    }
    return coupon
}

export function markUsed(code: string, orderId: string) {
    const coupon = store.coupons.get(code)
    if (coupon) {
        coupon.usedInOrderId = orderId
    }
    return coupon
}