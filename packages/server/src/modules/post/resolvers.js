import { withFilter } from 'graphql-subscriptions';
import { createBatchResolver } from 'graphql-resolve-batch';

const POST_SUBSCRIPTION = 'post_subscription';
const POSTS_SUBSCRIPTION = 'posts_subscription';
const TRANSACTION_SUBSCRIPTION = 'transaction_subscription';

export default pubsub => ({
  Query: {
    async posts(obj, { limit, after }, context) {
      let edgesArray = [];
      let posts = await context.Post.postsPagination(limit, after);

      posts.map(post => {
        edgesArray.push({
          cursor: post.id,
          node: {
            id: post.id,
            title: post.title,
            content: post.content
          }
        });
      });

      const endCursor = edgesArray.length > 0 ? edgesArray[edgesArray.length - 1].cursor : 0;

      const values = await Promise.all([context.Post.getTotal(), context.Post.getNextPageFlag(endCursor)]);

      return {
        totalCount: values[0].count,
        edges: edgesArray,
        pageInfo: {
          endCursor: endCursor,
          hasNextPage: values[1].count > 0
        }
      };
    },
    post(obj, { id }, context) {
      return context.Post.post(id);
    }
  },
  Post: {
    transactions: createBatchResolver((sources, args, context) => {
      return context.Post.getTransactionsForPostIds(sources.map(({ id }) => id));
    })
  },
  Mutation: {
    async addPost(obj, { input }, context) {
      const [id] = await context.Post.addPost(input);
      const post = await context.Post.post(id);
      // publish for post list
      pubsub.publish(POSTS_SUBSCRIPTION, {
        postsUpdated: {
          mutation: 'CREATED',
          id,
          node: post
        }
      });
      return post;
    },
    async deletePost(obj, { id }, context) {
      const post = await context.Post.post(id);
      const isDeleted = await context.Post.deletePost(id);
      if (isDeleted) {
        // publish for post list
        pubsub.publish(POSTS_SUBSCRIPTION, {
          postsUpdated: {
            mutation: 'DELETED',
            id,
            node: post
          }
        });
        return { id: post.id };
      } else {
        return { id: null };
      }
    },
    async editPost(obj, { input }, context) {
      await context.Post.editPost(input);
      const post = await context.Post.post(input.id);
      // publish for post list
      pubsub.publish(POSTS_SUBSCRIPTION, {
        postsUpdated: {
          mutation: 'UPDATED',
          id: post.id,
          node: post
        }
      });
      // publish for edit post page
      pubsub.publish(POST_SUBSCRIPTION, { postUpdated: post });
      return post;
    },
    async addTransaction(obj, { input }, context) {
      const [id] = await context.Post.addTransaction(input);
      const transaction = await context.Post.getTransaction(id);
      // publish for edit post page
      pubsub.publish(TRANSACTION_SUBSCRIPTION, {
        transactionUpdated: {
          mutation: 'CREATED',
          id: transaction.id,
          postId: input.postId,
          node: transaction
        }
      });
      return transaction;
    },
    async deleteTransaction(obj, { input: { id, postId } }, context) {
      await context.Post.deleteTransaction(id);
      // publish for edit post page
      pubsub.publish(TRANSACTION_SUBSCRIPTION, {
        transactionUpdated: {
          mutation: 'DELETED',
          id,
          postId,
          node: null
        }
      });
      return { id };
    },
    async editTransaction(obj, { input }, context) {
      await context.Post.editTransaction(input);
      const transaction = await context.Post.getTransaction(input.id);
      // publish for edit post page
      pubsub.publish(TRANSACTION_SUBSCRIPTION, {
        transactionUpdated: {
          mutation: 'UPDATED',
          id: input.id,
          postId: input.postId,
          node: transaction
        }
      });
      return transaction;
    }
  },
  Subscription: {
    postUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(POST_SUBSCRIPTION),
        (payload, variables) => {
          return payload.postUpdated.id === variables.id;
        }
      )
    },
    postsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(POSTS_SUBSCRIPTION),
        (payload, variables) => {
          return variables.endCursor <= payload.postsUpdated.id;
        }
      )
    },
    transactionUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(TRANSACTION_SUBSCRIPTION),
        (payload, variables) => {
          return payload.transactionUpdated.postId === variables.postId;
        }
      )
    }
  }
});
