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

## Decision: checkout returns the order and the reward coupon as separate siblings

**Context:** Every nth order auto-mints a reward coupon. Checkout has two things to hand back: the placed order and, sometimes, a freshly minted reward coupon. The order is a frozen historical record (see the cart-vs-order decision above). The reward coupon is a transient bonus produced by this one checkout, redeemed later by some future order.

**Options considered:**
- Option A: Flatten, return { ...order, rewardCoupon }. Fewer keys for the client, one flat object.
- Option B: Wrap, return { order, rewardCoupon }. The order stays untouched, the reward sits beside it.
- Option C: Return the bare Order and signal the reward some other way (a second response field on the route, a lookup endpoint, and so on).

**Choice:** Option B. checkout() returns { order, rewardCoupon }, where rewardCoupon is the minted coupon on a milestone order and null otherwise. The shape is the same on both paths. The caller just truthiness-checks rewardCoupon.

**Why:** The order is meant to be a trusted snapshot of what was bought, the same object that lives in store.orders. Flattening (Option A) would spread a transient, per-checkout reward across that record, so an Order in a response would sometimes carry a rewardCoupon field that isn't on the stored order. That blurs the line between the order and what else happened during this checkout. Wrapping keeps the line sharp: the order is the order, the reward is a sibling. It also keeps two different coupons from colliding in one object. The coupon the buyer spent on this order already lives on it as couponUsed, while rewardCoupon is the new one minted for next time, and naming them as separate keys stops anyone from confusing them. Returning the same { order, rewardCoupon } shape on every checkout (null when there's no reward) means the route and tests never branch on whether the key exists. They read one field and check it. Option C hides a result the caller clearly needs and forces a second round trip for no benefit.

## Decision: one eligibility check and one generator, shared by checkout and admin, made idempotent by a milestone counter

**Context:** The spec states the discount rule in two voices that pull against each other. "Every nth order gets a coupon code" reads as automatic, minted at checkout. The admin section's "generate a discount code if the condition above is satisfied" reads as manual, triggered by an admin call but gated on the same nth-order condition. Both must hold: a customer gets the reward by placing the nth order, and an admin asking for that same reward gets refused when no milestone has been reached. The risk is implementing "the condition" twice and letting the copies drift, or minting two coupons for one milestone because both entry points fire on it.

**Options considered:**
- Option A: Auto-only. Checkout mints on the nth order; the admin endpoint generates arbitrary codes with no gate. Satisfies the first line, not the admin clause.
- Option B: Admin-only. The admin endpoint is the sole minter; checkout never auto-rewards. Satisfies the admin clause, breaks "every nth order gets a coupon."
- Option C: One predicate, isEligible(), and one action, grantRewardIfEligible(), both in coupon.service and called from checkout and admin. A counter, config.lastRewardedOrderCount, records where a reward was last minted, so one milestone can't mint twice regardless of which path reaches it first.

**Choice:** Option C. isEligible() is pure: orders.length is above zero, an exact multiple of config.nthOrder, and not equal to config.lastRewardedOrderCount. grantRewardIfEligible() is the shared action: if eligible, mint at the configured percentage and set lastRewardedOrderCount to the current count, else return null. Checkout calls it after saving the order and returns the result as rewardCoupon. Admin calls the same function and turns null into a 400, "no reward available: nth-order condition not met."

**Why:** One rule, one home. Writing the eligibility math in both places gives two copies that agree only until someone edits one. Splitting the question from the action matters because an admin dry run wants to ask without minting, and a predicate with no side effects is safe to call anywhere. The action got extracted only here because it got its second caller only here: through Step 6 the mint-and-record block lived inline in checkout, and admin is the caller that justifies pulling it out.

The counter is what makes the two callers safe together. Checkout is the only thing that grows orders.length, so it always lands on a multiple of nthOrder first, mints, and stamps lastRewardedOrderCount. A later admin call at that same count sees count equal to lastRewardedOrderCount, fails isEligible(), and gets a 400. That's the idempotency working, not a gap: one milestone, one coupon, claimed by whoever arrives first. The percentage comes from config.rewardDiscountPct, not the caller, because the discount is store policy, so both paths mint identical rewards.