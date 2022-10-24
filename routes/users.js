const router = require("express").Router();
const crypto = require("crypto");

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash("sha256");
  const hash = sha256.update(password).digest("base64");
  return hash;
};

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const user = await req.mongoClient
    .collection("users")
    .findOne({ email: req.body.email });

  if (user && user.password !== process.env.DEFAULT_PASSWORD) {
    if (user.password === getHashedPassword(req.body.password)) {
      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        org_id: user.org_id,
        role_id: user.role_id,
      };

      let roleId = parseInt(user.role_id);
      if (roleId === 1) {
        req.flash("success_messages", "You are logged in");
        res.redirect("/admin-update");
      } else if (roleId === 2) {
        req.flash("success_messages", "You are logged in");
        res.redirect("/update");
      } else {
        req.flash(
          "error_messages",
          "Fatal error. Please contact the system administrator"
        );
        res.redirect("/");
      }
    } else {
      req.flash("error_messages", "Password is incorrect, please try again");
      res.redirect("/user/login");
    }
  } else if (user && user.password === process.env.DEFAULT_PASSWORD) {
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      org_id: user.org_id,
      role_id: user.role_id,
    };
    req.flash(
      "error_messages",
      "You are logging in for the first time. Please change your password"
    );
    res.redirect("/user/change-password");
  } else {
    req.flash(
      "error_messages",
      "You do not have an account. Please contact the system administrator"
    );
    res.redirect("/user/login");
  }
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  req.flash("success_messages", "You have been successfully logged out");
  res.redirect("/");
});

router.get("/change-password", async (req, res) => {
  if (req.session && req.session.user) {
    const userName = req.session.user.name;

    res.render("change-password", {
      userName: userName,
    });
  } else {
    req.flash(
      "error_messages",
      "The page you were trying to access is only for registered users who have logged in."
    );
    res.redirect("/user/login");
  }
});

router.post("/change-password", async (req, res) => {
  if (req.session) {
    const userEmail = req.session.user.email;

    try {
      userPassword = getHashedPassword(req.body.password);

      await req.mongoClient.collection("users").updateOne(
        { email: userEmail },
        {
          $set: {
            password: userPassword,
          },
        }
      );

      req.session.user = null;
      req.flash(
        "success_messages",
        "Password successfully changed. Please login again."
      );
      res.redirect("/user/login");
    } catch (e) {
      console.log(e);
      req.flash(
        "error_messages",
        "Fatal error. Please contact the system administrator."
      );
      res.redirect("/user/login");
    }
  } else {
    req.flash(
      "error_messages",
      "The page you were trying to access is only for registered users who have logged in."
    );
    res.redirect("/user/login");
  }
});

module.exports = router;
