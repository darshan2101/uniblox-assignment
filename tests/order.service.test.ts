import { seedStore, store } from "../src/store/store"
import { describe, it, expect, beforeEach } from "@jest/globals";

import { checkout } from "../src/services/order.service"
import { addItem, getCart, removeItem } from "../src/services/cart.service";
import { generateCoupon, isEligible } from "../src/services/coupon.service";

describe("Order Checkoout tests", () => {

    beforeEach(() => {
        store.carts.clear(); store.couponSeq = 0; store.orderSeq = 0;
        store.products.clear(); store.orders.length = 0; store.coupons.clear();
        store.config.lastRewardedOrderCount = 0;
        store.config.nthOrder = 5
        seedStore()
    })

    const productId = "p1"
    const quantity = 2

    function placeOrders(userId: string, n: number){
        for(let i:number = 1; i <= n ; i ++){
            addItem(userId, productId, quantity);
            expect(store.carts.get(userId)?.items.length).toBe(1);
            expect(store.orders.length).toBe(i - 1);
            // checking that we are not receiving rewardCoupon
            const result = checkout(userId);
            expect(result.rewardCoupon).toBe(null);
        }
    }

    it("should checkout with zero discountAMount and total equal to subtotal when no coupon is applied", () => {
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

    it("should return rewardCouon upon target orders are met with nth order setup", () => {
        const userId = "user1"

        // attempt 1-4 where we will not get rewardCoupon
        placeOrders(userId, 4)

        //  5th attempt which meets nth order criteria 
        addItem(userId, productId, quantity);
        const result = checkout(userId);
        expect(result.rewardCoupon).toHaveProperty("code")
        expect(result.rewardCoupon?.discountPct).toBe(store.config.rewardDiscountPct)
        expect(result.rewardCoupon?.usedInOrderId).toBe(null)
    })

    it("should not return rewardCoupon upon order length goes past nth order by is not divisible by n", () => {
        const userId = "user1"

        // attempt 1-4 where we will not get rewardCoupon
        placeOrders(userId, 4)

        //  5th attempt which meets nth order criteria 
        addItem(userId, productId, quantity);
        const result = checkout(userId);
        expect(result.rewardCoupon).toHaveProperty("code");
        expect(result.rewardCoupon?.discountPct).toBe(store.config.rewardDiscountPct)
        expect(result.rewardCoupon?.usedInOrderId).toBe(null);

        // attempt 6 : we should not get rewardCoupon now
        addItem(userId, productId, 1);
        const response = checkout(userId);
        expect(response.rewardCoupon).toBe(null);
    })

    it("should not double reward when milestone of nth order is reached", () => {
        const userId = "user1"

        // attempt 1-4 where we will not get rewardCoupon
        placeOrders(userId, 4)

        //  5th attempt which meets nth order criteria 
        addItem(userId, productId, quantity);
        const result = checkout(userId);
        expect(result.rewardCoupon).toHaveProperty("code");
        expect(store.config.lastRewardedOrderCount).toBe(5)
        expect(isEligible()).toBe(false)

    })

})