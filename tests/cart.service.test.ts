import {store} from  "../src/store/store"
import {addItem, removeItem, getCart} from "../src/services/cart.service"
import {seedStore} from "../src/store/store"
import { describe, it, expect, beforeEach } from "@jest/globals";


describe("Cart Service", () => {
    beforeEach(() => {
        // Clear carts before each test
        store.carts.clear()
        // Clear products before each test
        store.products.clear()
        // Seed the store with initial products before each 
        seedStore()
    })

    it("should add an item to empty cart", () => {
        const userId = "user1"
        const productId = "p1"
        const quantity = 2

        const result = addItem(userId, productId, quantity)
        expect(result.items.length).toBe(1)
        expect(result.items[0]).toEqual({ productId, quantity })
    } )

    it("should change quantity of an item at cart if item already exists", () => {
        const userId = "user1"
        const productId = "p1"
        const quantity = 2

        addItem(userId, productId, quantity)
        const result = addItem(userId, productId, 3)
        expect(result.items.length).toBe(1)
        expect(result.items[0]).toEqual({ productId, quantity: 5 })
    })

    it("if different item is added to cart, it should be added as new item", () => {
        const userId = "user1"
        const productId1 = "p1"
        const productId2 = "p2"
        const quantity1 = 1
        const quantity2 = 3

        addItem(userId, productId1, quantity1)
        const result = addItem(userId, productId2, quantity2)
        expect(result.items.length).toBe(2)
        expect(result.items).toContainEqual({ productId: productId1, quantity: quantity1 })
        expect(result.items).toContainEqual({ productId: productId2, quantity: quantity2 })
    })

    it("should throw error if product does not exist", () => {
        const userId = "user1"
        const productId = "vine2"
        const quantity = 1
        expect(() => addItem(userId, productId, quantity)).toThrow("product not found")
    })

    it("should remove item from cart", () => {
        const userId = "user1"
        const productId = "p1"
        const quantity = 2

        addItem(userId, productId, quantity)
        const result = removeItem(userId, productId)
        expect(result.items.length).toBe(0)
    })

    it("should not throw error if user tries to remove product from cart which does not exist in cart", () => {
        const userId = "user1"
        const productId = "p1"

        const result = removeItem(userId, productId)
        expect(result.items.length).toBe(0)
    })
})
