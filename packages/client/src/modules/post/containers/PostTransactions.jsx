import React from 'react';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';

import PostTransactionsView from '../components/PostTransactionsView';

import ADD_TRANSACTION from '../graphql/AddTransaction.graphql';
import EDIT_TRANSACTION from '../graphql/EditTransaction.graphql';
import DELETE_TRANSACTION from '../graphql/DeleteTransaction.graphql';
import TRANSACTION_SUBSCRIPTION from '../graphql/TransactionSubscription.graphql';
import ADD_TRANSACTION_CLIENT from '../graphql/AddTransaction.client.graphql';
import TRANSACTION_QUERY_CLIENT from '../graphql/TransactionQuery.client.graphql';

function AddTransaction(prev, node) {
  // ignore if duplicate
  if (prev.post.transactions.some(transaction => transaction.id === node.id)) {
    return prev;
  }

  const filteredTransactions = prev.post.transactions.filter(transaction => transaction.id);

  return update(prev, {
    post: {
      transactions: {
        $set: [...filteredTransactions, node]
      }
    }
  });
}

function DeleteTransaction(prev, id) {
  const index = prev.post.transactions.findIndex(x => x.id === id);

  // ignore if not found
  if (index < 0) {
    return prev;
  }

  return update(prev, {
    post: {
      transactions: {
        $splice: [[index, 1]]
      }
    }
  });
}

class PostTransactions extends React.Component {
  static propTypes = {
    postId: PropTypes.number.isRequired,
    postContent: PropTypes.object,
    transactions: PropTypes.array.isRequired,
    transaction: PropTypes.object.isRequired,
    onTransactionSelect: PropTypes.func.isRequired,
    subscribeToMore: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.subscription = null;
  }

  componentWillReceiveProps(nextProps) {
    // Check if props have changed and, if necessary, stop the subscription
    if (this.subscription && this.props.postId !== nextProps.postId) {
      this.subscription = null;
    }

    // Subscribe or re-subscribe
    if (!this.subscription) {
      this.subscribeToTransactionList(nextProps.postId);
    }
  }

  componentWillUnmount() {
    this.props.onTransactionSelect({ id: null, content: '' });

    if (this.subscription) {
      // unsubscribe
      this.subscription();
    }
  }

  subscribeToTransactionList = postId => {
    const { subscribeToMore } = this.props;

    this.subscription = subscribeToMore({
      document: TRANSACTION_SUBSCRIPTION,
      variables: { postId },
      updateQuery: (prev, { subscriptionData: { data: { transactionUpdated: { mutation, id, node } } } }) => {
        let newResult = prev;

        if (mutation === 'CREATED') {
          newResult = AddTransaction(prev, node);
        } else if (mutation === 'DELETED') {
          newResult = DeleteTransaction(prev, id);
        }

        return newResult;
      }
    });
  };

  render() {
    return <PostTransactionsView {...this.props} />;
  }
}

const PostTransactionsWithApollo = compose(
  graphql(ADD_TRANSACTION, {
    props: ({ mutate }) => ({
      addTransaction: (content, balance, timeStamp, postId) => {
        mutate({
          variables: { input: { content, balance, timeStamp, postId } },
          optimisticResponse: {
            __typename: 'Mutation',
            addTransaction: {
              __typename: 'Transaction',
              id: null,
              content: content,
              balance: balance,
              timeStamp: timeStamp
            }
          },
          updateQueries: {
            post: (prev, { mutationResult: { data: { addTransaction } } }) => {
              if (prev.post) {
                return AddTransaction(prev, addTransaction);
              }
            }
          }
        });
      }
    })
  }),
  graphql(EDIT_TRANSACTION, {
    props: ({ ownProps: { postId }, mutate }) => ({
      editTransaction: (id, content) =>
        mutate({
          variables: { input: { id, postId, content } },
          optimisticResponse: {
            __typename: 'Mutation',
            editTransaction: {
              __typename: 'Transaction',
              id: id,
              content: content
            }
          }
        })
    })
  }),
  graphql(DELETE_TRANSACTION, {
    props: ({ ownProps: { postId }, mutate }) => ({
      deleteTransaction: id =>
        mutate({
          variables: { input: { id, postId } },
          optimisticResponse: {
            __typename: 'Mutation',
            deleteTransaction: {
              __typename: 'Transaction',
              id: id
            }
          },
          updateQueries: {
            post: (prev, { mutationResult: { data: { deleteTransaction } } }) => {
              if (prev.post) {
                return DeleteTransaction(prev, deleteTransaction.id);
              }
            }
          }
        })
    })
  }),
  graphql(ADD_TRANSACTION_CLIENT, {
    props: ({ mutate }) => ({
      onTransactionSelect: transaction => {
        mutate({ variables: { transaction: transaction } });
      }
    })
  }),
  graphql(TRANSACTION_QUERY_CLIENT, {
    props: ({ data: { transaction } }) => ({ transaction })
  })
)(PostTransactions);

export default PostTransactionsWithApollo;
