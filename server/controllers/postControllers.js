const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  // Request needs a body
  if (!req.body) {
    return res.status(400).send({ message: "Post content required" });
  }

  // Body needs a score, time, and message
  const { score } = req.body;
  if (score === undefined) {
    return res.status(400).send({ message: "Score is required" });
  }

  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  // Create the post
  const post = await Post.create(userId, score);

  // Send the created post back
  res.status(201).send(post);
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.getAll();
    console.log(posts);
    res.status(200).send(posts);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch posts." });
  }
};

exports.getScoresSorted = async (req, res) => {
  try {
    const scores = await Post.getScoresSorted();
    res.status(200).send(scores);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch scores." });
  }
};

exports.getUserScores = async (req, res) => {
  try {
    const userId = req.params.id;
    const scores = await Post.getUserScores(userId);
    res.status(200).send(scores);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch user scores." });
  }
};
