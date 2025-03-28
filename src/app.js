import express from 'express'
import cors from 'cors';


const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        Credentials: true
    })
)


//common middleware
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

//import routes
import healthcheckroute from "./routes/healthcheckroute.js";


// route
app.use("/api/v1/healthcheck", healthcheckroute)


export {app}