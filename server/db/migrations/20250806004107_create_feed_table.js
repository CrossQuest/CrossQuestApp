/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('feed', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('score').notNullable();
    table.text('message').defaultTo('');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('feed');
};
