
interface Product {
    id: string;
    name: string;
    price: number;
}

interface CartItem {
    productId: string;
    quantity: number;
}

interface Cart {
    userId: string;
    items: CartItem[];
}

interface Order {
    id: string;
    userId: string;
    items: CartItem[];
    subtotal: number;
    discountAmount: number;
    total: number;
    couponUsed: string | null;
    createdAt: Date;
}

interface Coupon {
    code: string;
    discountPct: number;
    usedInOrderId: string | null;
}

interface Config {
    nthOrder: number;
    rewardDiscountPct: number;
    lastRewardedOrderCount: number;
}

// export all interfaces for use in other modules
export type { Product, Cart, CartItem, Order, Coupon, Config };