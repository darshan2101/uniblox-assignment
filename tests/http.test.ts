import { beforeEach, describe, it, expect } from "@jest/globals"
import app from "../src/app"
import request from "supertest"
import { store, seedStore } from "../src/store/store"

describe("Http and Route level tests", () => {
    beforeEach(() => {
        store.carts.clear(); store.products.clear();
        store.coupons.clear(); store.orders.length = 0;
        store.couponSeq = 0; store.orderSeq = 0;
        store.config.lastRewardedOrderCount = 0;
        store.config.nthOrder = 3;

        seedStore()
    })

    it("should return sucess in case we recive all correct parameter while adding items to cart", async () => {
        const response = await request(app).post("/cart/u1/items").send({ productId: "p1", quantity: 2 })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty("items")
        expect(response.body.message).toBe("item added to cart successfully")

    })

    it("should return error when non integer or negative value get passed as quantity", async () => {
        const response = await request(app).post("/cart/u1/items").send({ productId: "p1", quantity: "N4" })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("quantity must be a positive integer")
    })

    it("should return error when productId is not passed", async () => {
        const response = await request(app).post("/cart/u1/items").send({ quantity: 2 })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("productId is required")
    })

    it("should throw error when cart is empty and checkout gets attempted", async () => {
        const response = await request(app).post("/checkout/u1").send({})

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("cart is empty")
    })

    it("should throw error when route which does not exist is tried by user", async () => {
        const response = await request(app).post("/carts/clearall").send({ delete: "*" })

        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe("not found")
    })

    it("should throw error when wron coupon code gets passed with 400 error code", async () => {
        //  adding item to cart
        await request(app).post("/cart/u1/items").send({ productId: "p1", quantity: 2 })

        // checking out with wrong coupon code

        const response = await request(app).post("/checkout/u1").send({ couponCode: "DUMMY100" })

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ success: false, message: "invalid coupon" })
    })


})
