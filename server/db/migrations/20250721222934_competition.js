/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("competition", (table) => {
    table.increments();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table
      .integer("player_2_id")
      .notNullable()
      .references("id")
      .inTable("users");
    table.integer("score_player_1");
    table.integer("score_player_2");
    table.string("winner");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("competition");
};
