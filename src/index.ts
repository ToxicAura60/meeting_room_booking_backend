import 'dotenv/config'
import express from 'express'
import meetingRoomRouter from "./routes/meeting-room.route"
import bookingRouter from "./routes/booking.route"
import authRouter from "./routes/auth.route"
import userRouter from "./routes/user.route"
import cookieParser from "cookie-parser"

const app = express()

app.use(express.json())
app.use(cookieParser()); 

app.use("/meeting-room", meetingRoomRouter);
app.use("/booking", bookingRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);

const port = Number(process.env.PORT) || 3000

const server = app.listen(port, () => {
  console.log(`Server running on ${port}`)
})