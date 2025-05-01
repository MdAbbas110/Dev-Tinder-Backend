const express = require("express");

const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

const USER_EXTRACTED_FIELDS =
  "firstName lastName photoUrl age about skills gender";

// Get all the pending connection request for the loggedIn user
userRouter.get("/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // .find() method will give the array of objects an d findOne returns a single object
    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_EXTRACTED_FIELDS);

    res.status(200).json({
      success: true,
      data: connectionRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch connection requests",
    });
  }
});

userRouter.get("/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_EXTRACTED_FIELDS)
      .populate("toUserId", USER_EXTRACTED_FIELDS);

    const data = connections.map((row) =>
      row.fromUserId._id.toString() === loggedInUser._id.toString()
        ? row.toUserId
        : row.fromUserId
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch connections",
    });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    // to avid the limit being passed more then 10 max allowed is 50
    limit = limit > 50 ? 50 : limit;

    const skipFormula = (page - 1) * limit;

    console.log(page, limit, skipFormula);

    const alreadyInteracted = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    // Will create a set to store the interacted list and get just single unique id in
    const hiddenUsersOnFeed = new Set();
    alreadyInteracted.forEach((request) => {
      hiddenUsersOnFeed.add(request.fromUserId);
      hiddenUsersOnFeed.add(request.toUserId);
    });

    const usersToShow = await User.find({
      $and: [
        { _id: { $nin: Array.from(hiddenUsersOnFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_EXTRACTED_FIELDS)
      .skip(skipFormula)
      .limit(limit);

    res.send(usersToShow);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = userRouter;
