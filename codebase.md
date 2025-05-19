# .gitignore

```
node_modules 
```

# package.json

```json
{
  "name": "devtinder",
  "version": "1.0.0",
  "description": "tinder for developers to find match",
  "main": "index.js",
  "scripts": {
    "start": "nodemon src/app",
    "dev": "nodemon src/app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "nodejs.",
    "javascript"
  ],
  "author": "abbas abidi",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.13.0",
    "nodemon": "^3.1.9",
    "socket.io": "^4.8.1",
    "validator": "^13.15.0"
  }
}

```

# src/app.js

```js
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

```

# src/config/database.js

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://AbbasAbidi:OzrhnzktL9YyAxkz@devtinder.6bqqz.mongodb.net/devTinder"
  );
};

module.exports = connectDB;

```

# src/middlewares/auth.js

```js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  // job of this middleware is to read the cookies form req cookies

  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized User",
      });
    }

    const decodedObj = await jwt.verify(token, "DEV@TINDER$007");

    const { _id } = decodedObj;
    if (!_id) throw new Error("User not found");

    const user = await User.findById({ _id });
    if (!user) throw new Error("Failed to load the user");

    req.user = user;
    next();
  } catch (error) {
    res.status(400).send("Error: " + error.message);
  }
};

module.exports = { userAuth };

```

# src/models/chat.js

```js
const mongoose = require('mongoose');

// separate the message schema from the chat schema
const chatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ],
  messages: [chatMessageSchema],
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Chat };

```

# src/models/connectionRequest.js

```js
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: ["ignored", "accepted", "interested", "rejected"],
        message: "{VALUE} is not supported",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre middleware is also a way to check the logic before saving the data
connectionRequestSchema.pre("save", function (next) {
  // check if the user id of sender and receiver is same
  const connectionRequest = this;
  if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
    throw new Error("Sender and receiver cannot be the same");
  }
  next();
});

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

const ConnectionRequest = new mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema
);

module.exports = ConnectionRequest;

```

# src/models/user.js

```js
//User schema what field user will have in database
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minLength: 4, maxLength: 30 },

    lastName: { type: String },

    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is not valid");
        }
      },
    },

    password: {
      type: String,
      required: true,
    },

    age: { type: Number, min: 18 },

    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "{VALUE} is not supported",
      },
    },

    photoUrl: {
      type: String,
      validate(value) {
        if (value && !validator.isURL(value)) {
          // Only validate if value exists
          throw new Error("Photo URL is not valid");
        }
      },
      default:
        "https://thumbs.dreamstime.com/b/blank-grey-scale-profile-picture-placeholder-suitable-representing-user-avatar-contact-generic-style-short-hair-335067558.jpg",
    },

    about: {
      type: String,
      default: "fallback default user info",
      // Add a setter to handle empty strings
      set: (v) => (v === "" ? undefined : v),
    },

    skills: {
      type: [String],
      default: [], // Ensure empty array as default
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.getJWT = async function () {
  const user = this;
  const expiresIn = 7 * 24 * 60 * 60;
  const token = await jwt.sign({ _id: user._id }, "DEV@TINDER$007", {
    expiresIn,
  });
  return { token, expiresAt: Date.now() + expiresIn * 1000 };
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    user.password
  );

  return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);

```

# src/routes/auth.js

```js
const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { validateSignUpData } = require("../utils/validation");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    // Destructure all possible fields from req.body
    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      photoUrl,
      about,
      skills,
    } = req.body;

    // Validate signup data
    validateSignUpData(req);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user object with all possible fields
    const userData = {
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      // Only include optional fields if they're provided
      ...(age && { age: Number(age) }),
      ...(gender && { gender }),
      ...(photoUrl && { photoUrl }),
      ...(about && { about }),
      ...(skills && { skills }),
    };

    // Create and save user
    const user = new User(userData);
    const savedUser = await user.save();

    // Generate JWT token using your schema method
    const { token, expiresAt } = await savedUser.getJWT();

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(expiresAt), // Use the expiration timestamp
    });

    // Send structured response
    res.status(201).json({
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    // Proper error handling with specific status codes
    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (error.code === 11000) {
      // MongoDB duplicate key error
      statusCode = 409;
      errorMessage = "Email already exists";
    } else if (error.name === "ValidationError") {
      // Mongoose validation error
      statusCode = 400;
      errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
    } else if (error.name === "SignUpValidationError") {
      // Your custom validation error
      statusCode = 400;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        message: errorMessage,
        code: statusCode,
      },
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId))
      throw new Error("Email or password is not valid");

    const user = await User.findOne({ emailId: emailId });

    if (!user) throw new Error("Revalidate the email or password");

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const { token, expiresAt } = await user.getJWT();

      res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(expiresAt), // Use the expiration timestamp
      });

      res.status(200).json({
        success: true,
        data: user,
      });
      // added the token to cookies and send the response
    } else {
      throw new Error("Failed to login check email or password");
    }
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout Successful!!");
});

module.exports = authRouter;

```

# src/routes/profile.js

```js
const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");

const profileRouter = express.Router();

profileRouter.get("/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      data: user,
    });
  } catch (error) {
    res.status(400).send("Error :" + error.message);
  }
});

profileRouter.patch("/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid edit request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      success: true,
      data: loggedInUser,
    });
  } catch (error) {
    res.status(400).send("Error : " + error);
  }
});

profileRouter.post("/reset/password", userAuth, async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const isValidPassword = await bcrypt.compare(
      oldPassword,
      req.user.password
    );

    if (!isValidPassword)
      res.status(400).json({ error: "Incorrect old password" });

    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Enter a strong new password" });
    }

    if (newPassword !== confirmPassword)
      res.json({ error: "New password and confirm password must match" });

    req.user.password = newPassword;
    await req.user.save();

    res.status(200).json({ message: "Password successfully updated" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

profileRouter.post("/forgot/password", userAuth, (req, res) => {
  const { emailId } = req.body;
});

module.exports = profileRouter;

```

# src/routes/request.js

```js
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

```

# src/routes/user.js

```js
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

```

# src/utils/socket.js

```js
const crypto = require('crypto');
const socket = require('socket.io');
const { Chat } = require('../models/chat');

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash('sha256')
    .update([userId, targetUserId].sort().join('$'))
    .digest('hex');
};

const initializedSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: 'http://localhost:5173',
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinChat', ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + 'Joined room' + roomId);
      socket.join(roomId);
    });

    socket.on(
      'sendMessage',
      async ({ firstName, userId, targetUserId, text }) => {
        const roomId = getSecretRoomId(userId, targetUserId);
        console.log('sending the message ' + text);

        try {
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          // If this both user are chatting for the first time
          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId: userId,
            text,
          });

          await chat.save();

          io.to(roomId).emit('messageReceived', { firstName, text });
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    );
  });
};

module.exports = initializedSocket;

```

# src/utils/validation.js

```js
const validator = require("validator");

// Improved validation function
const validateSignUpData = (req) => {
  const { firstName, emailId, password } = req.body;

  if (!firstName || firstName.length < 4 || firstName.length > 30) {
    throw new SignUpValidationError(
      "First name must be between 4 and 30 characters"
    );
  }

  if (!emailId || !validator.isEmail(emailId)) {
    throw new SignUpValidationError("Valid email is required");
  }

  if (!password || password.length < 6) {
    throw new SignUpValidationError(
      "Password must be at least 6 characters long"
    );
  }

  // Add password strength validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new SignUpValidationError(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    );
  }

  return true;
};

const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "age",
    "skills",
    "gender",
    "photoUrl",
    "about",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );

  return isEditAllowed;
};

const validateResetPasswordData = (req) => {
  const allowedEditFields = ["password"];
};

module.exports = {
  validateSignUpData,
  validateEditProfileData,
};

```

