# Design decisions

## Decision: in-memory store as a Map-based singleton

**Context:** The store holds products, carts, orders, and coupons for as long as the server runs. The assignment says an in-memory store is fine and no database is required.

**Options considered:**
- Option A: SQLite (or another lightweight DB) for real persistence and SQL queries.
- Option B: Plain JS objects and arrays as the store.
- Option C: One module-level object holding Maps (carts by userId, coupons by code), an array for orders, a config object, and a couponSeq counter.

**Choice:** Option C. A single exported store object: Maps for keyed collections, an array for the ordered list of orders, plus config and the coupon counter.

**Why:** The spec allows in-memory and further tells that no database is needed, so SQLite would pull in a dependency, a schema, serialization, and test fixtures to solve a persistence problem the demo never has. State only needs to survive one run. A Map gives O(1) keyed lookup and avoids prototype-key collisions like __proto__ and constructor, which a plain object would expose. Putting everything in one object means each service imports the same source of truth, and that object already matches the shape a repository layer would take if this later moved to Postgres.


## Decision: single-use coupon enforcement via a bidirectional order/coupon link

**Context:** A discount code must be usable exactly once. After an order consumes a coupon, that code can never apply a discount again, and we want to know which order consumed which coupon.

**Options considered:**
- Option A: A boolean isUsed flag on the coupon. Minimal, just true/false.
- Option B: A reference link. The coupon records the order that consumed it (usedInOrderId), and the order records the coupon it used (couponUsed).

**Choice:** Option B. Coupon.usedInOrderId: string | null and Order.couponUsed: string | null point at each other. null means unused or no coupon, a non-null value means consumed.

**Why:** "Used or not" is the same single bit a boolean carries, so the reference costs nothing extra to check (usedInOrderId !== null) but also stores why it's used, the exact order, for free. That audit trail makes admin stats and debugging easy, since you can trace any discount back to its order. Keeping the link on both sides means either record answers the question without scanning the other collection.

## Decision: cart references live prices, order freezes them as a snapshot

**Context:** The cart and a placed order deal with the same products and the same money, but they answer different questions. A cart shows what the user would pay if they checked out right now. An order records what they actually paid at the moment they bought. Product prices can change while the server runs, since an admin could re-seed or adjust them.

**Options considered:**
- Option A: Store price (and name) on every CartItem and copy them onto the order too. One uniform shape everywhere.
- Option B: Treat both as live. Always recompute totals from the current product price, including for past orders.
- Option C: Split the rule by purpose. The cart stores only productId + quantity and looks the price up live on read; the order stores subtotal, discountAmount, and total as plain numbers captured at checkout.

**Choice:** Option C. CartItem holds productId + quantity and nothing about money. Checkout reads each product's current price to compute the order, then writes subtotal, discountAmount, and total onto the Order as fixed numbers.

**Why:** The two records have opposite correctness rules even though they hold the same kind of data. A cart must reflect the current price. If a price changes, a stale copy sitting in the cart would quote a number that no longer exists, so the product stays the single source of truth and the cart just points at it (productId). An order does the reverse. It's a historical record, so last week's total must never move when next week's price changes. Freezing the money as numbers at checkout makes the order immutable by construction: there's nothing to recompute, so nothing can drift. Option A duplicates price into the cart and invites stale quotes. Option B would silently rewrite financial history every time a price moved. Splitting by what each record is for, "what you'd pay now" vs "what you paid then," keeps both correct.