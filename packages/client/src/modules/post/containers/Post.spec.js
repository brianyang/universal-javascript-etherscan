import { expect } from 'chai';
import { step } from 'mocha-steps';
import _ from 'lodash';

import Renderer from '../../../testHelpers/Renderer';
import POSTS_SUBSCRIPTION from '../graphql/PostsSubscription.graphql';
import POST_SUBSCRIPTION from '../graphql/PostSubscription.graphql';
import TRANSACTION_SUBSCRIPTION from '../graphql/TransactionSubscription.graphql';

const createNode = id => ({
  id: `${id}`,
  title: `Post title ${id}`,
  content: `Post content ${id}`,
  transactions: [
    { id: id * 1000 + 1, content: 'Post transaction 1', __typename: 'Transaction' },
    { id: id * 1000 + 2, content: 'Post transaction 2', __typename: 'Transaction' }
  ],
  __typename: 'Post'
});

const mutations = {
  editPost: true,
  addTransaction: true,
  editTransaction: true,
  onTransactionSelect: true
};

const mocks = {
  Query: () => ({
    posts(ignored, { after }) {
      const totalCount = 4;
      const edges = [];
      for (let i = +after + 1; i <= +after + 2; i++) {
        edges.push({
          cursor: i,
          node: createNode(i),
          __typename: 'PostEdges'
        });
      }
      return {
        totalCount,
        edges,
        pageInfo: {
          endCursor: edges[edges.length - 1].cursor,
          hasNextPage: true,
          __typename: 'PostPageInfo'
        },
        __typename: 'Posts'
      };
    },
    post(obj, { id }) {
      return createNode(id);
    }
  }),
  Mutation: () => ({
    deletePost: (obj, { id }) => createNode(id),
    deleteTransaction: (obj, { input }) => input,
    ...mutations
  })
};

describe('Posts and transactions example UI works', () => {
  const renderer = new Renderer(mocks, {});
  let app;
  let content;

  beforeEach(() => {
    // Reset spy mutations on each step
    Object.keys(mutations).forEach(key => delete mutations[key]);
    if (app) {
      app.update();
      content = app.find('#content').last();
    }
  });

  step('Posts page renders without data', () => {
    app = renderer.mount();
    content = app.find('#content').last();
    renderer.history.push('/posts');

    content.text().should.equal('Loading...');
  });

  step('Posts page renders with data', () => {
    expect(content.text()).to.include('Post title 1');
    expect(content.text()).to.include('Post title 2');
    expect(content.text()).to.include('2 / 4');
  });

  step('Clicking load more works', () => {
    const loadMoreButton = content.find('#load-more').last();
    loadMoreButton.simulate('click');
  });

  step('Clicking load more loads more posts', () => {
    expect(content.text()).to.include('Post title 3');
    expect(content.text()).to.include('Post title 4');
    expect(content.text()).to.include('4 / 4');
  });

  step('Check subscribed to post list updates', () => {
    expect(renderer.getSubscriptions(POSTS_SUBSCRIPTION)).has.lengthOf(1);
  });

  step('Updates post list on post delete from subscription', () => {
    const subscription = renderer.getSubscriptions(POSTS_SUBSCRIPTION)[0];
    subscription.next({
      data: {
        postsUpdated: {
          mutation: 'DELETED',
          node: createNode(2),
          __typename: 'UpdatePostPayload'
        }
      }
    });

    expect(content.text()).to.not.include('Post title 2');
    expect(content.text()).to.include('3 / 3');
  });

  step('Updates post list on post create from subscription', () => {
    const subscription = renderer.getSubscriptions(POSTS_SUBSCRIPTION)[0];
    subscription.next(
      _.cloneDeep({
        data: {
          postsUpdated: {
            mutation: 'CREATED',
            node: createNode(2),
            __typename: 'UpdatePostPayload'
          }
        }
      })
    );

    expect(content.text()).to.include('Post title 2');
    expect(content.text()).to.include('4 / 4');
  });

  step('Clicking delete optimistically removes post', () => {
    mutations.deletePost = (obj, { id }) => {
      return createNode(id);
    };

    const deleteButtons = content.find('.delete-button');
    expect(deleteButtons).has.lengthOf(12);
    deleteButtons.last().simulate('click');

    expect(content.text()).to.not.include('Post title 4');
    expect(content.text()).to.include('3 / 3');
  });

  step('Clicking delete removes the post', () => {
    expect(content.text()).to.include('Post title 3');
    expect(content.text()).to.not.include('Post title 4');
    expect(content.text()).to.include('3 / 3');
  });

  step('Clicking on post works', () => {
    const postLinks = content.find('.post-link');
    postLinks.last().simulate('click', { button: 0 });
  });

  step('Clicking on post opens post form', () => {
    const postForm = content.find('form[name="post"]');

    expect(content.text()).to.include('Edit Post');
    expect(
      postForm
        .find('[name="title"]')
        .last()
        .instance().value
    ).to.equal('Post title 3');
    expect(
      postForm
        .find('[name="content"]')
        .last()
        .instance().value
    ).to.equal('Post content 3');
  });

  step('Check subscribed to post updates', () => {
    expect(renderer.getSubscriptions(POST_SUBSCRIPTION)).has.lengthOf(1);
  });

  step('Updates post form on post updated from subscription', () => {
    const subscription = renderer.getSubscriptions(POST_SUBSCRIPTION)[0];
    subscription.next({
      data: {
        postUpdated: {
          id: '3',
          title: 'Post title 203',
          content: 'Post content 204',
          __typename: 'Post'
        }
      }
    });
    const postForm = content.find('form[name="post"]');
    expect(
      postForm
        .find('[name="title"]')
        .last()
        .instance().value
    ).to.equal('Post title 203');
    expect(
      postForm
        .find('[name="content"]')
        .last()
        .instance().value
    ).to.equal('Post content 204');
  });

  step('Post editing form works', done => {
    mutations.editPost = (obj, { input }) => {
      expect(input.id).to.equal(3);
      expect(input.title).to.equal('Post title 33');
      expect(input.content).to.equal('Post content 33');
      done();
      return input;
    };

    const postForm = app.find('form[name="post"]').last();
    postForm
      .find('[name="title"]')
      .last()
      .simulate('change', { target: { name: 'title', value: 'Post title 33' } });
    postForm
      .find('[name="content"]')
      .last()
      .simulate('change', { target: { name: 'content', value: 'Post content 33' } });
    postForm.simulate('submit');
  });

  step('Check opening post by URL', () => {
    renderer.history.push('/post/3');
  });

  step('Opening post by URL works', () => {
    const postForm = content.find('form[name="post"]');

    expect(content.text()).to.include('Edit Post');
    expect(
      postForm
        .find('[name="title"]')
        .last()
        .instance().value
    ).to.equal('Post title 33');
    expect(
      postForm
        .find('[name="content"]')
        .last()
        .instance().value
    ).to.equal('Post content 33');
    expect(content.text()).to.include('Edit Post');
  });

  step('Transaction adding works', done => {
    mutations.addTransaction = (obj, { input }) => {
      expect(input.postId).to.equal(3);
      expect(input.content).to.equal('Post transaction 24');
      done();
      return input;
    };

    const transactionForm = content.find('form[name="transaction"]');
    transactionForm
      .find('[name="content"]')
      .last()
      .simulate('change', { target: { name: 'content', value: 'Post transaction 24' } });
    transactionForm.last().simulate('submit');
  });

  step('Transaction adding works after submit', () => {
    expect(content.text()).to.include('Post transaction 24');
  });

  step('Updates transaction form on transaction added got from subscription', () => {
    const subscription = renderer.getSubscriptions(TRANSACTION_SUBSCRIPTION)[0];
    subscription.next({
      data: {
        transactionUpdated: {
          mutation: 'CREATED',
          id: 3003,
          postId: 3,
          node: {
            id: 3003,
            content: 'Post transaction 3',
            __typename: 'Transaction'
          },
          __typename: 'UpdateTransactionPayload'
        }
      }
    });

    expect(content.text()).to.include('Post transaction 3');
  });

  step('Updates transaction form on transaction deleted got from subscription', () => {
    const subscription = renderer.getSubscriptions(TRANSACTION_SUBSCRIPTION)[0];
    subscription.next({
      data: {
        transactionUpdated: {
          mutation: 'DELETED',
          id: 3003,
          postId: 3,
          node: {
            id: 3003,
            content: 'Post transaction 3',
            __typename: 'Transaction'
          },
          __typename: 'UpdateTransactionPayload'
        }
      }
    });
    expect(content.text()).to.not.include('Post transaction 3');
  });

  step('Transaction deleting optimistically removes transaction', () => {
    const deleteButtons = content.find('.delete-transaction');
    expect(deleteButtons).has.lengthOf(9);
    deleteButtons.last().simulate('click');

    app.update();
    content = app.find('#content').last();
    expect(content.text()).to.not.include('Post transaction 24');
    expect(content.find('.delete-transaction')).has.lengthOf(6);
  });

  step('Clicking transaction delete removes the transaction', () => {
    expect(content.text()).to.not.include('Post transaction 24');
    expect(content.find('.delete-transaction')).has.lengthOf(6);
  });

  step('Transaction editing works', async done => {
    mutations.editTransaction = (obj, { input }) => {
      expect(input.postId).to.equal(3);
      expect(input.content).to.equal('Edited transaction 2');
      done();
      return input;
    };
    const editButtons = content.find('.edit-transaction');
    expect(editButtons).has.lengthOf(6);
    editButtons.last().simulate('click');
    editButtons.last().simulate('click');
    const transactionForm = content.find('form[name="transaction"]');
    expect(
      transactionForm
        .find('[name="content"]')
        .last()
        .instance().value
    ).to.equal('Post transaction 2');
    transactionForm
      .find('[name="content"]')
      .last()
      .simulate('change', { target: { name: 'content', value: 'Edited transaction 2' } });
    transactionForm.simulate('submit');
  });

  step('Transaction editing works', () => {
    expect(content.text()).to.include('Edited transaction 2');
  });

  step('Clicking back button takes to post list', () => {
    expect(content.text()).to.include('Edited transaction 2');
    const backButton = content.find('#back-button');
    backButton.last().simulate('click', { button: 0 });
    app.update();
    content = app.find('#content').last();
    expect(content.text()).to.include('Post title 3');
  });
});
