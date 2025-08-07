/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('competitions', (table) => {
    table.integer('challenger_attempts').defaultTo(0);
    table.integer('challenged_attempts').defaultTo(0);
    table.integer('max_attempts').defaultTo(3);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('competitions', (table) => {
    table.dropColumn('challenger_attempts');
    table.dropColumn('challenged_attempts');
    table.dropColumn('max_attempts');
  });
}; 