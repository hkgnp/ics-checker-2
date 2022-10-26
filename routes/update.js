const router = require("express").Router();

const { checkIfLoggedIn } = require("../middlewares");
const { ObjectId } = require("mongodb");

router.get("/", checkIfLoggedIn, async (req, res) => {
  if (req.session) {
    const orgId = req.session.user.org_id;

    const org = await req.mongoClient
      .collection("organisations")
      .findOne({ _id: ObjectId(orgId) });

    res.render("update", {
      orgName: org,
    });
  } else {
    req.flash(
      "error_messages",
      "Fatal error. Please contact the system administrator."
    );
    res.redirect("/");
  }
});

router.post("/", async (req, res) => {
  if (req.session) {
    const orgId = req.session.user.org_id;

    try {
      await req.mongoClient.collection("organisations").updateOne(
        { _id: ObjectId(orgId) },
        {
          $set: {
            last_updated: new Date(),
            earliest_admission: req.body.earliest_admission,
            medifund_cases: req.body.medifund_cases,
            special_remarks: req.body.special_remarks,
          },
        },
        { upsert: true }
      );

      req.flash("success_messages", "ICS details successfully updated!");
      res.redirect("/");
    } catch (e) {
      console.log(e);
    }
  }
});

module.exports = router;
