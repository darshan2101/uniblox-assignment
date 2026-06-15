import type {Product, Cart, Order, Coupon, Config} from "../types/index"

// In-memory data store which will hold all products, carts, orders, coupons and configuration settings
export const store = {
    products: new Map<string, Product>(),
    carts: new Map<string, Cart>(),
    orders: [] as Order[],
    coupons: new Map<string, Coupon>(),
    config: { nthOrder: 5, rewardDiscountPct: 10, lastRewardedOrderCount: 0 } as Config,
    couponSeq: 0,
    orderSeq: 0
}

// A seed function to add some initial products to the store
export function seedStore() {
    const initialProducts: Product[] = [
        { id: "p1", name: "Product 1", price: 100 },
        { id: "p2", name: "Product 2", price: 200 },
        { id: "p3", name: "Product 3", price: 300 },
        { id: "p4", name: "Product 4", price: 400 },
        { id: "p5", name: "Product 5", price: 500 },
    ]
    initialProducts.forEach(product => store.products.set(product.id, product))
}