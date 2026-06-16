# Uniblox Assignment — Cart & Checkout API

An in-memory ecommerce cart/checkout API with an nth-order coupon reward and admin stats.
Built with TypeScript + Express. No database — state lives in memory and resets on restart
(by design; see [`DECISIONS.md`](./DECISIONS.md) #1).

## Setup

```bash
npm install
npm run dev      # server on http://localhost:3000
npm test         # 30 tests (24 service-level + 6 HTTP-level)
```

`npm run build` compiles to `dist/`; `npm start` runs the compiled server.

## Seeded data

Products are seeded on boot:

| id | name      | price |
|----|-----------|-------|
| p1 | Product 1 | 100   |
| p2 | Product 2 | 200   |
| p3 | Product 3 | 300   |
| p4 | Product 4 | 400   |
| p5 | Product 5 | 500   |

Discount rule: **every 5th order** auto-mints a reward coupon for **10% off**
(`nthOrder: 5`, `rewardDiscountPct: 10`). That coupon is redeemed on a later checkout.

## Response shape

Every response is `{ success, message, data }`. Errors are `{ success: false, message }`
with the matching HTTP status (e.g. `400` for bad input, `404` for unknown routes) — produced
in one central error middleware.

## Endpoints

| Method | Path                              | Description                                            |
|--------|-----------------------------------|--------------------------------------------------------|
| GET    | `/health`                         | Liveness check → `{ ok: true }`                        |
| GET    | `/cart/:userId`                   | View a user's cart                                     |
| POST   | `/cart/:userId/items`             | Add an item — body `{ productId, quantity }`           |
| DELETE | `/cart/:userId/items/:productId`  | Remove an item from the cart                           |
| POST   | `/checkout/:userId`               | Place an order — optional body `{ couponCode }`        |
| GET    | `/admin/stats`                    | Items purchased, revenue, discounts, and coupon codes  |
| POST   | `/admin/coupons/generate`         | Mint a reward coupon — only when the nth-order rule is met |

Example requests for every endpoint are in [`postman_collection.json`](./postman_collection.json)
(import into Postman).

## Happy-path walkthrough

1. **Add to cart** — `POST /cart/u1/items` with `{ "productId": "p1", "quantity": 2 }`.
2. **Checkout** — `POST /checkout/u1` with `{}` → an order with `subtotal: 200`, no discount.
3. **Reach the milestone** — place 4 more checkouts (re-add items each time; checkout clears the
   cart). The **5th** order's response includes a `rewardCoupon` (`DISC-1`, 10% off).
4. **Redeem it** — `POST /checkout/u1` with `{ "couponCode": "DISC-1" }` → discount applied,
   `total = subtotal − 10%`.
5. **Admin stats** — `GET /admin/stats` → `totalItemsPurchased`, `totalPurchaseAmount` (revenue
   after discounts), `totalDiscountAmount`, and `discountCodes` (every minted coupon + whether it
   was used).

## Tests

- **Service tests** (`tests/*.service.test.ts`, `coupon.test.ts`) — core business logic: cart
  merge/remove, coupon generate/validate/eligibility, checkout math, the nth-order reward, and
  admin stats reading the frozen order snapshot.
- **HTTP tests** (`tests/http.test.ts`) — the route layer: boundary validation, the error
  envelope, and the 404 handler.

## Known omissions (deliberate)

- **No auth** — `userId` is a path param; this is a single-run demo, the spec asks for none.
- **No persistence** — in-memory by design (spec allows it; avoids a DB for a one-run demo).
- **No coupon expiry / per-user limits** — out of scope; add only if required.

Design rationale for the choices above is in [`DECISIONS.md`](./DECISIONS.md).
