const User = require("../models/User");

exports.createPost = async (req, res) => {
  // Request needs a body
  if (!req.body) {
    return res.status(400).send({ message: "Post content required" });
  }

  // Body needs a score, time, and message
  const { score, time, message } = req.body;
  if (score === undefined && time === undefined && !message) {
    return res
      .status(400)
      .send({ message: "Score, time, or message is required" });
  }

  // Create the post
  const post = await User.createPost(req.session.userId, score, time, message);

  // Send the created post back
  res.status(201).send(post);
};
