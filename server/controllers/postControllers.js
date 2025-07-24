const Post = require("../models/Post");

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
  const post = await Post.create(req.session.userId, score, time, message);

  // Send the created post back
  res.status(201).send(post);
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.getAll();
    res.status(200).send(posts);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch posts." });
  }
};
