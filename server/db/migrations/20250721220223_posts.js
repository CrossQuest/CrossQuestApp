/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) => {
  return knex.schema.createTable("posts", (table) => {
    table.increments();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table.integer("score");
    table.integer("time");
    table.string("message");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("posts");
};
