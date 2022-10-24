const router = require("express").Router();

router.get("/", async (req, res) => {
  const icsDetails = await req.mongoClient
    .collection("organisations")
    .find({})
    .toArray();

  res.render("index", {
    icsDetails: icsDetails,
  });
});

module.exports = router;
