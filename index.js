import bodyParser from "body-parser"
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import customerRouter from "./routes/customerRoutes.js"
import chatRouter from "./routes/chatRoutes.js"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import { app, server } from "./socket/socket.js";
dotenv.config();
// const app = express();

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
}))
app.use(bodyParser.json())
app.use(cookieParser())

//routes declaration
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/customer", customerRouter)
app.use("/api/chat", chatRouter)
// Socket.IO connection
connectDB()
    .then(() => {
        server.listen(process.env.PORT, () => {
            console.log(`Server is running at port:${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });


