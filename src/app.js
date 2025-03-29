import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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
app.use(cookieParser());

//import routes
import healthcheckroute from "./routes/healthcheckroute.js";
import userRouter from './routes/user.routes.js'
import { errorHandler } from './middlewares/error.middlewares.js';


// route
app.use("/api/v1/healthcheck", healthcheckroute)
app.use("/api/v1/users", userRouter)

//for handling error, not that compulsory
app.use(errorHandler)
export {app}