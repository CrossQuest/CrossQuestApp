/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("competitions", (table) => {
    table.increments("id");
    table
      .integer("challenger_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("challenged_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("challenger_score").defaultTo(0);
    table.integer("challenged_score").defaultTo(0);
    table
      .enum("status", ["pending", "active", "completed", "declined"])
      .defaultTo("pending");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("start_time");
    table.timestamp("end_time");
    table.string("winner").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("competitions");
};
