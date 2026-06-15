import express from "express"
import {store, seedStore} from "./store/store"
import cartRoutes from "./routes/cart"

const app = express();

// health endpoint to verify server is running
app.get("/health", (req,res) => {
    res.json({ok: true})
})


// check if we have data in the store, if not seed it with some initial products
if(store.products.size === 0) {
    seedStore()
}

app.use(express.json())
// register cart routes with express application
app.use("/cart", cartRoutes)

// port assignment for express application
app.listen(3000, () => console.log("server is live on port: 3000"))