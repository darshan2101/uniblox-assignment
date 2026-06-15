import express from "express"

const app = express();

app.get("/health", (req,res) => {
    console.log("hello world")
    res.json({ok: true})
})

app.listen(3000, () => console.log("server is live on port: 3000"))

