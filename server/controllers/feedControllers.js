const Feed = require("../models/Feed");

exports.createFeedEntry = async (req, res) => {
  // Request needs a body
  if (!req.body) {
    return res.status(400).send({ message: "Feed content required" });
  }

  // Body needs a score and message
  const { score, message } = req.body;
  if (score === undefined) {
    return res.status(400).send({ message: "Score is required" });
  }

  // Get user ID from session
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    console.log('Creating feed entry with:', { userId, score, message });
    // Create the feed entry
    const feedEntry = await Feed.create(userId, score, message || null);
    console.log('Created feed entry:', feedEntry);
    res.status(201).send(feedEntry);
  } catch (err) {
    console.error('Error creating feed entry:', err);
    res.status(500).send({ message: "Failed to create feed entry." });
  }
};

exports.getAllFeed = async (req, res) => {
  try {
    const feed = await Feed.getAll();
    console.log('Fetched feed entries:', feed);
    res.status(200).send(feed);
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).send({ message: "Failed to fetch feed." });
  }
};

exports.getUserFeed = async (req, res) => {
  try {
    const userId = req.params.id;
    const feed = await Feed.getUserFeed(userId);
    res.status(200).send(feed);
  } catch (err) {
    console.error('Error fetching user feed:', err);
    res.status(500).send({ message: "Failed to fetch user feed." });
  }
}; 