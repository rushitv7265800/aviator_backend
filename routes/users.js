var express = require("express");
var router = express.Router();
const userController = require("../controller/user.controller");
var cors = require("cors");
router.use(cors())
/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});
router.post("/signupLogin", userController.signupLogin);

module.exports = router;