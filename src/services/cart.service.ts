import { store } from "../store/store"

export function addItem(userId: string, productId: string, quantity: number) {
    const product = store.products.get(productId)
    if (!product) {
        throw  { status: 404, message: "product not found" };
    }
    let cart = store.carts.get(userId) ?? { userId, items: [] }
    const existingItem = cart.items.find(item => item.productId === productId)
    if (existingItem) {
        existingItem.quantity += quantity
    } else {
        cart.items.push({ productId, quantity })
    }
    store.carts.set(userId, cart)
    return cart
}

export function removeItem(userId: string, productId: string) {
    const cart = store.carts.get(userId) ?? { userId, items: [] }

    cart.items = cart.items.filter(item => item.productId !== productId)
    store.carts.set(userId, cart)
    return cart
}

export function getCart(userId: string) {
    const cart = store.carts.get(userId) ?? { userId, items: [] }
    return cart
}