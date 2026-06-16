import { describe, it, expect, beforeEach } from "@jest/globals";
import { getStats, generateAdminCoupon } from "../src/services/admin.service"
import {store, seedStore} from "../src/store/store"
import { addItem } from "../src/services/cart.service";
import { checkout } from "../src/services/order.service";
import { generateCoupon } from "../src/services/coupon.service";


describe("Admin service Tests", () => {
    beforeEach(() => {
        store.carts.clear(); store.products.clear();
        store.coupons.clear(); store.orders.length = 0;
        store.couponSeq = 0; store.orderSeq = 0;
        store.config.lastRewardedOrderCount = 0;
        store.config.nthOrder = 3;

        seedStore()
    })
    const userId = "user1"
    const productId = "p1"
    const quantity = 2

    it("should return all four stats with multiple orders which are in store", () => {
        // checking stats before orders
        const priorStats = getStats()
        expect(priorStats.discountCodes.length).toBe(0)
        expect(priorStats.totalPurchaseAmount).toBe(0)
        expect(priorStats.totalDiscountAmount).toBe(0)
        expect(priorStats.totalItemsPurchased).toBe(0)

        // order without any coupon
        addItem(userId, productId, quantity)
        checkout(userId)

        addItem(userId, productId, quantity)
        // generating coupon to use
        const coupon = generateCoupon()
        checkout(userId, coupon.code)

        // checking order length
        expect(store.orders.length).toBe(2)

        // now checking stats
        const finalStats = getStats()
    
        expect(finalStats.totalItemsPurchased).toBe(4)
        expect(finalStats.totalPurchaseAmount).toBe(380)
        expect(finalStats.totalDiscountAmount).toBe(20)
        expect(finalStats.discountCodes.length).toBe(1)
        
    })

    it("should always generate stats from order snapshots not from live updates", () => {
        addItem(userId, productId, quantity)
        checkout(userId)

        const product = store.products.get(productId);
        if (product) {
            product.price = 9999;
        }

        // checking effect of price at stats
        const stats = getStats()
    
        expect(stats.totalItemsPurchased).toBe(2)
        expect(stats.totalPurchaseAmount).toBe(200)
        expect(stats.totalDiscountAmount).toBe(0)
        expect(stats.discountCodes.length).toBe(0)
    })

    it("should only generate coupon from admin service and here admin and checkout shares same guard and both will not mint same outcome ", () => {
        // checking coupon generation by admin before orders
        expect(() => generateAdminCoupon()).toThrow("no reward available: nth-order condition not met")

        addItem(userId, productId, quantity)
        checkout(userId)

        expect(() => generateAdminCoupon()).toThrow("no reward available: nth-order condition not met")

        addItem(userId, productId, quantity)
        checkout(userId)

        expect(() => generateAdminCoupon()).toThrow("no reward available: nth-order condition not met")

        addItem(userId, productId, quantity)
        checkout(userId)

        expect(store.config.lastRewardedOrderCount).toBe(3)
        expect(() => generateAdminCoupon()).toThrow("no reward available: nth-order condition not met")

    })

})