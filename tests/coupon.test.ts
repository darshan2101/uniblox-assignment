import {store} from "../src/store/store"
import { describe, it, expect, beforeEach } from "@jest/globals";
import {generateCoupon, isEligible, validateCoupon, markUsed} from "../src/services/coupon.service"

describe("Coupon Service", () => {

    beforeEach(() => {
        // Clear orders and coupons before each test
        store.coupons.clear()
        store.orders.length = 0
        store.couponSeq = 0
        store.config.lastRewardedOrderCount = 0
    })

    it("should generate a coupon code with default discount when called without passing one", () => {
        const coupon = generateCoupon()
        expect(coupon.code).toBe("DISC-1")
        expect(coupon.discountPct).toBe(store.config.rewardDiscountPct)
        expect(coupon.usedInOrderId).toBeNull()
    })

    it("should set appropriate coupon code when called consecutively", () => {
        const coupon1 = generateCoupon()
        const coupon2 = generateCoupon()
        expect(coupon1.code).toBe("DISC-1")
        expect(coupon2.code).toBe("DISC-2")
    })

    it("should throw error when a non-existent coupon code gets passed down", () => {
        expect(() => validateCoupon("INVALID")).toThrow({ status: 400, message: "invalid coupon" })
    })

    it("should throw error when an already used coupon code gets passed down", () => {
        const coupon = generateCoupon()
        markUsed(coupon.code, "order1")
        expect(() => validateCoupon(coupon.code)).toThrow("coupon already used")
    })

    it("On a valid coupon code it should acknowledge the fresh coupon and return it" , () => {
        const coupon = generateCoupon(12)
        expect(validateCoupon(coupon.code)).toBe(coupon)
    })

    it("should deny copon at zero orders and nor multiples counts should only accept when order length hits nth order", () => {
        // checking eligibility at 0 orders
        expect(isEligible()).toBe(false)

        // checking eligibility with order 1-4
        for(let i: number = 1; i < 5 ; i++){
            store.orders.push({ id: `order${i}`} as any)
            expect(isEligible()).toBe(false)
        }

        //  final check where we add multiplier of 5 which is default config nth multiplier 
        store.orders.push({ id: "order1" } as any)
        expect(isEligible()).toBe(true)
    })

    it("should set orderId at coupon in usedInOrderId field to mark on which order it was used", () => {
        const coupon = generateCoupon()
        const result = markUsed(coupon.code, "order1")
        expect(result?.usedInOrderId).toBe("order1")
    })

})