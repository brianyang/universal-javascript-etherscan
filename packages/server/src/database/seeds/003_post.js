import { truncateTables } from '../../sql/helpers';

export async function seed(knex, Promise) {
  await truncateTables(knex, Promise, ['post', 'transaction']);

  await Promise.all(
    [...Array(1).keys()].map(async ii => {
      const post = await knex('post')
        .returning('id')
        .insert({
          title: `0xb2930B35844a230f00E51431aCAe96Fe543a0347`,
          content: `0xb2930B35844a230f00E51431aCAe96Fe543a0347`
        });

      await Promise.all(
        [...Array(2).keys()].map(async jj => {
          return knex('transaction')
            .returning('id')
            .insert({
              post_id: post[0],
              content: `0xb2930B35844a230f00E51431aCAe96Fe543a0347`,
              balance: `0`,
              timeStamp: '123'
            });
        })
      );
    })
  );
}
