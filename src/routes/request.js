const express = require("express");
const User = require("../models//user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const requestRouter = express.Router();

// Api for the user to send a connection request
requestRouter.post("/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    const allowedStatuses = ["interested", "ignored"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed statuses are 'interested' or 'ignored'.",
      });
    }

    const toUserExists = await User.findById(toUserId);
    if (!toUserExists) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the connection request already exists
    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId: fromUserId, toUserId: toUserId },
        // Not allowed  req from user if already one user has sent it
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    // existingConnection will tell if the request already exists so if already exists then we will not create a new one
    if (existingConnectionRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists",
      });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const data = await connectionRequest.save();

    res.status(200).json({
      success: true,
      message:
        status === "interested"
          ? `Connection request send to ${toUserExists.firstName}`
          : `Connection request ignored by ${fromUserId.firstName}`,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Api for the user to accept the request
requestRouter.post("/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    const allowedStatuses = ["accepted", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed statuses are 'accepted' or 'rejected'.",
      });
    }

    // check the connection request exists in database
    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested",
    });

    if (!connectionRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request not found",
      });
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();

    res.status(200).json({
      success: true,
      message:
        status === "accepted"
          ? `Connection request accepted by ${loggedInUser.firstName}`
          : `Connection request rejected by ${loggedInUser.firstName}`,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = requestRouter;
