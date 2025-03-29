const validateSignUpData = (req) => {
  // first will extract the data form the req body
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName)
    throw new Error("First name and last name are required");
};
