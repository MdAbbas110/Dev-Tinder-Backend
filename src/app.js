const cors = require("cors");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const initializedSocket = require("./utils/socket");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Using all the routes defined
app.use("/", authRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);

const server = http.createServer(app);
initializedSocket(server);

connectDB()
  .then(() => {
    console.log("database connected");
    server.listen(3000, () => {
      console.log(
        "server started accepting req when db connect connects properly"
      );
    });
  })
  .catch((err) => console.log(err, "error in connecting db"));
