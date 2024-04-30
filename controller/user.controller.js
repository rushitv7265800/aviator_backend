const User = require("../model/user.model");
const Cryptr = require("cryptr");

const cryptr = new Cryptr("myTotallySecretKey", {
  pbkdf2Iterations: 10000,
  saltLength: 10,
});

exports.signupLogin = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password || !req.body.type) {
      //type == 1 : signup , 2 :login
      return res.status(400).json({
        status: false,
        message: "Invalid details...!!",
      });
    }
    let user = await User.findOne({ email: req.body.email.trim() });
    if (user) {
      if (cryptr.decrypt(user.password) !== req.body.password) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid password" });
      }
      user.userName = req.body.userName ? req.body.userName : user.userName;
      await user.save();

      return res.status(200).json({
        status: true,
        message:
          req.body.type == 1
            ? "User already Exist, Login Successfully !!"
            : "Login SuccessFully !!",
        user,
      });
    }
    if (req.body.type == 1) {
      user = new User();
      user.userName = req.body.userName
        ? req.body.userName.trim()
        : "Game User";
      user.email = req.body.email.trim();
      user.password = cryptr.encrypt(req.body.password);
      await user.save();

      return res.status(200).json({
        status: true,
        message: "Signup Successfully !!",
        user,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "User Does Not Found , please signUp !!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "server error",
    });
  }
};