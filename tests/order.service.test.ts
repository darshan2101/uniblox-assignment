import { seedStore, store } from "../src/store/store"
import { describe, it, expect, beforeEach } from "@jest/globals";

import { checkout } from "../src/services/order.service"
import { addItem, getCart, removeItem } from "../src/services/cart.service";
import { generateCoupon } from "../src/services/coupon.service";

describe("Order Checkoout tests", () => {

    beforeEach(() => {
        store.carts.clear(); store.couponSeq = 0; store.orderSeq = 0;
        store.products.clear(); store.orders.length = 0; store.coupons.clear();
        store.config.lastRewardedOrderCount = 0;
        seedStore()
    })

    it("should checkout with zero discountAMount and total equal to subtotal when no coupon is applied", () => {
        const productId = "p1"
        const quantity = 2
        const userId = "user1"
        addItem(userId, productId, quantity)
        expect(store.carts.get(userId)?.items.length).toBe(1)
        expect(store.orders.length).toBe(0)

        checkout(userId)

        expect(store.carts.get(userId)?.items.length).toBeUndefined()
        expect(store.orders.length).toBe(1)
        expect(store.orders[0].discountAmount).toBe(0)
        expect(store.orders[0].total).toBe(store.orders[0].subtotal)

    })

    it("should subtract discountAmount from subtotal if valid coupon is applied at time of checkout" , () => {
        const productId = "p2"
        const quantity = 1
        const userId = "user2"
        addItem(userId, productId, quantity)
        expect(store.carts.get(userId)?.items.length).toBe(1)
        expect(store.orders.length).toBe(0)

        // generating coupon to apply
        const coupon = generateCoupon(10)
        checkout(userId, coupon.code)

        expect(store.carts.get(userId)?.items.length).toBeUndefined()
        expect(store.orders.length).toBe(1)

        const discountAmt = (store.orders[0].subtotal * coupon.discountPct ) / 100
        expect(store.orders[0].discountAmount).toBe(discountAmt)
        expect(store.orders[0].total).toBe(store.orders[0].subtotal - discountAmt )

        expect(coupon.usedInOrderId).toBe(store.orders[0].id)
    })

    it("should throw error if coupon which is already got used gets passed during checkout", () => {
        const productId = "p2"
        const quantity = 1
        const userId = "user2"
        addItem(userId, productId, quantity)
        expect(store.carts.get(userId)?.items.length).toBe(1)
        expect(store.orders.length).toBe(0)

        // generating coupon to apply and checkout
        const coupon = generateCoupon(10)
        checkout(userId, coupon.code)

        //  using same token with different order
        addItem(userId,productId,4)
        
        expect(store.carts.get(userId)?.items.length).toBe(1)
        expect(store.orders.length).toBe(1)
        expect(() => checkout(userId, coupon.code)).toThrow("coupon already used")
    })
    
    it("should throw an error if checkout is tried with empty cart", () => {
        const productId = "p2"
        const quantity = 1
        const userId = "user2"
        // add item to get cart
        addItem(userId, productId, quantity)
        // remove item to make cart empty
        removeItem(userId,productId)

        // checking cart is empty
        expect(store.carts.get(userId)?.items.length).toBe(0)
        // checking out with empty cart
        expect(() => checkout(userId)).toThrow("cart is empty")
    })


    it("after checkout cart should become empty and return empty when accessing", () => {
        const productId = "p1"
        const quantity = 2
        const userId = "user1"
        addItem(userId, productId, quantity)
        expect(store.carts.get(userId)?.items.length).toBe(1)
        expect(store.orders.length).toBe(0)

        checkout(userId)
        expect(store.carts.get(userId)?.items.length).toBeUndefined()
        expect(store.orders.length).toBe(1)

        //  check of accesing cart after checkout
        expect(getCart(userId).items.length).toBe(0)

    })

})