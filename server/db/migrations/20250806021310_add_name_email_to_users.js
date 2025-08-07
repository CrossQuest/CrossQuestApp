exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('name').notNullable().defaultTo('');
    table.string('email').notNullable().defaultTo('');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('name');
    table.dropColumn('email');
  });
}; 