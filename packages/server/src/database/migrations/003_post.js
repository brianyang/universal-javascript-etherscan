exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema
      .createTable('post', table => {
        table.increments();
        table.string('title');
        table.string('content');
        table.timestamps(false, true);
      })
      .createTable('transaction', table => {
        table.increments();
        table
          .integer('post_id')
          .unsigned()
          .references('id')
          .inTable('post')
          .onDelete('CASCADE');
        table.string('content');
        table.string('balance');
        table.string('timeStamp');
        table.timestamps(false, true);
      })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('transaction'), knex.schema.dropTable('post')]);
};
