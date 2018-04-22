import { orderedFor } from '../../sql/helpers';
import knex from '../../sql/connector';

export default class Post {
  postsPagination(limit, after) {
    let where = '';
    if (after > 0) {
      where = `id < ${after}`;
    }

    return knex
      .select('id', 'title', 'content')
      .from('post')
      .whereRaw(where)
      .orderBy('id', 'desc')
      .limit(limit);
  }

  async getTransactionsForPostIds(postIds) {
    const res = await knex
      .select('id', 'content', 'balance', 'timeStamp', 'post_id AS postId')
      .from('transaction')
      .whereIn('post_id', postIds);

    return orderedFor(res, postIds, 'postId', false);
  }

  getTotal() {
    return knex('post')
      .countDistinct('id as count')
      .first();
  }

  getNextPageFlag(id) {
    return knex('post')
      .countDistinct('id as count')
      .where('id', '<', id)
      .first();
  }

  post(id) {
    return knex
      .select('id', 'title', 'content')
      .from('post')
      .where('id', '=', id)
      .first();
  }

  addPost({ title, content }) {
    return knex('post')
      .insert({ title, content })
      .returning('id');
  }

  deletePost(id) {
    return knex('post')
      .where('id', '=', id)
      .del();
  }

  editPost({ id, title, content }) {
    return knex('post')
      .where('id', '=', id)
      .update({
        title: title,
        content: content
      });
  }

  addTransaction({ content, balance, timeStamp, postId }) {
    return knex('transaction')
      .insert({ content, balance, timeStamp, post_id: postId })
      .returning('id');
  }

  getTransaction(id) {
    return knex
      .select('id', 'content', 'balance', 'timeStamp')
      .from('transaction')
      .where('id', '=', id)
      .first();
  }

  deleteTransaction(id) {
    return knex('transaction')
      .where('id', '=', id)
      .del();
  }

  editTransaction({ id, content }) {
    return knex('transaction')
      .where('id', '=', id)
      .update({
        content: content
      });
  }
}
