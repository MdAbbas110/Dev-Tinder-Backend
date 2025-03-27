const adminAuth = (req, res, next) => {
  console.log("admin auth is getting checked");
  const token = "xyz";
  const isAdmin = token === "xyz";
  if (!isAdmin) {
    res.status(401).send("You are not admin");
  } else {
    next();
  }
};

const userAuth = (req, res, next) => {
  console.log("user auth is getting checked");
  const token = "xyz";
  const isAdmin = token === "xyz";
  if (!isAdmin) {
    res.status(401).send("You are not admin");
  } else {
    next();
  }
};

module.exports = { adminAuth, userAuth };
