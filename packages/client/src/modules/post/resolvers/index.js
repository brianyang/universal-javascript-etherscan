import TRANSACTION_QUERY_CLIENT from '../graphql/TransactionQuery.client.graphql';

const TYPE_NAME = 'TransactionState';
const TYPE_NAME_TRANSACTION = 'Transaction';

const defaults = {
  transaction: {
    id: null,
    content: '',
    balance: '',
    timeStamp: '',
    __typename: TYPE_NAME_TRANSACTION
  },
  __typename: TYPE_NAME
};

const resolvers = {
  Query: {
    transactionState: (_, args, { cache }) => {
      const { transaction: { transaction } } = cache.readQuery({ query: TRANSACTION_QUERY_CLIENT });
      return {
        transaction: {
          ...transaction,
          __typename: TYPE_NAME_TRANSACTION
        },
        __typename: TYPE_NAME
      };
    }
  },
  Mutation: {
    onTransactionSelect: async (_, { transaction }, { cache }) => {
      await cache.writeData({
        data: {
          transaction: {
            ...transaction,
            __typename: TYPE_NAME_TRANSACTION
          },
          __typename: TYPE_NAME
        }
      });

      return null;
    }
  }
};

export default {
  defaults,
  resolvers
};
