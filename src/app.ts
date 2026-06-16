import express, { ErrorRequestHandler } from "express"
import { store, seedStore } from "./store/store"
import cartRoutes from "./routes/cart"
import checkoutRoutes from "./routes/checkout"
import adminRoutes from "./routes/admin"

const app = express();

// health endpoint to verify server is running
app.get("/health", (req, res) => {
    res.json({ ok: true })
})


// check if we have data in the store, if not seed it with some initial products
if (store.products.size === 0) {
    seedStore()
}

app.use(express.json())

// register cart routes with express application
app.use("/cart", cartRoutes)
app.use("/checkout", checkoutRoutes)
app.use("/admin", adminRoutes)

app.use((_req, res) => res.status(404).json({ success: false, message: "not found" }))

// registering error middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === "number" ? err.status : 500
    const message = typeof err?.message === "string" ? err.message : "internal server error"
    res.status(status).json({ success: false, message })
}

app.use(errorHandler)

export default app