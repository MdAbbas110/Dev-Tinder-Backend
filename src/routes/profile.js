const express = require("express");
const { userAuth } = require("../middlewares/auth");
const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("Error :" + error.message);
  }
});

profileRouter.post("/send-connect", userAuth, async (req, res) => {
  console.log("sending connect req");
  res.send("connect sent");
});

module.exports = profileRouter;
