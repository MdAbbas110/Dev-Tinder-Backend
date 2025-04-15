const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

// Get all the pending connection request for the loggedIn user
userRouter.get("/requests", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch connection requests",
    });
  }
});

module.exports = userRouter;
