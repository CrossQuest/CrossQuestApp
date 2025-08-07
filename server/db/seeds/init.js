const User = require('../../models/User');
const Post = require('../../models/Post');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  await knex('posts').del()
  await knex('users').del();

  // resets user_id to 1 each time the seed file is executed.
  await knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1');

  // We could use `knex.raw` queries to create these users but we'll use the model
  await User.create('cool_cat', '1234');
  await User.create('l33t-guy', '1234');
  await User.create('wowow', '1234');


  await knex.raw('ALTER SEQUENCE posts_id_seq RESTART WITH 1');

  await Post.create(1, 100);
  await Post.create(2, 200);
  await Post.create(3, 300);
};
