var express = require("express");
var cors = require("cors");
var router = express.Router();
const Razorpay = require("razorpay");
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
router.use(cors())
router.post("/razorpay/create-order", function (req, res) {
  try {
    console.log(
      "....................................................++++++++++++++++++++++++"
    );
    if (!req.body.amount || !req.body.receipt) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid Details !!" });
    }
    var OrderID;
    var instance = new Razorpay({
      key_id: "rzp_test_fUcGUlNQ7ATs5v", //you'll find this in settings panel in razorpay dashboard
      key_secret: "Vn1LgZNmbDRoMzZcBvk44ejW", //this one too
    });
    var options = {
      amount: req.body.amount,
      receipt: req.body.receipt,
      currency: "INR",
      payment_capture: "0",
    };
    instance.orders.create(options, function (err, order) {
      return res.status(200).json({ status: true, message: order });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, error: err?.message || "Internal server error" });
  }
});

module.exports = router;