const express = require("express");
const requestRouter = express.Router();

requestRouter.post("/sendConnectionRequest", (req, res) => {
  res.send("request send");
});

module.exports = requestRouter;
