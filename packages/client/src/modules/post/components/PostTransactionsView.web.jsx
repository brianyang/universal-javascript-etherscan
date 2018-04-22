import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from '../../common/components/web';
import PostTransactionForm from './PostTransactionForm';

export default class PostTransactionsView extends React.PureComponent {
  static propTypes = {
    postId: PropTypes.number.isRequired,
    postContent: PropTypes.object,
    transactions: PropTypes.array.isRequired,
    transaction: PropTypes.object,
    addTransaction: PropTypes.func.isRequired,
    editTransaction: PropTypes.func.isRequired,
    deleteTransaction: PropTypes.func.isRequired,
    subscribeToMore: PropTypes.func.isRequired,
    onTransactionSelect: PropTypes.func.isRequired
  };

  handleEditTransaction = (id, content) => {
    const { onTransactionSelect } = this.props;
    onTransactionSelect({ id, content });
  };

  handleDeleteTransaction = id => {
    const { transaction, onTransactionSelect, deleteTransaction } = this.props;

    if (transaction.id === id) {
      onTransactionSelect({ id: null, content: '' });
    }

    deleteTransaction(id);
  };

  onSubmit = () => values => {
    const { transaction, postId, postObj, addTransaction, editTransaction, onTransactionSelect } = this.props;

    const params = {
      module: 'module=account',
      action: '&action=txlist',
      key: 'apikey=188XJMAW8PQFME8NAMVHZV1MSZDQAV27WF',
      startEndBlock: '&startblock=0&endblock=99999999',
      pageOffset: '&page=1&offset=10',
      sort: '&sort=asc&'
    };

    const handleTransactions = async () => {
      let trans = `http://api.etherscan.io/api?${params.module}${params.action}&address=${postObj.content}${
        params.startEndBlock
      }${params.pageOffset}${params.sort}${params.key}`;
      let response = await fetch(trans);
      let data = await response.json();
      for (let i = 0; i < 10; i++) {
        addTransaction(data.result[i].hash, data.result[i].value, data.result[i].timeStamp, postId);
      }
    };

    if (transaction.id === null) {
      handleTransactions();
    } else {
      editTransaction(transaction.id, values.content);
    }
    onTransactionSelect({ id: null, content: '' });
  };

  render() {
    const { postId, transactions, transaction, searchParams } = this.props;
    const columns = [
      {
        title: 'Timestamp',
        dataIndex: 'timeStamp',
        key: 'timeStamp'
      },
      {
        title: 'Tx Hash',
        dataIndex: 'content',
        key: 'content'
      },
      {
        title: 'Balance',
        dataIndex: 'balance',
        key: 'balance'
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (text, record) => (
          <div style={{ width: 120 }}>
            <Button
              color="primary"
              size="sm"
              className="delete-transaction"
              onClick={() => this.handleDeleteTransaction(record.id)}
            >
              Delete
            </Button>
          </div>
        )
      }
    ];

    return (
      <div>
        <h3>Transactions</h3>
        <PostTransactionForm
          postId={postId}
          onSubmit={this.onSubmit()}
          initialValues={transaction}
          transaction={transaction}
        />
        <h1 />
        <Table dataSource={transactions} columns={columns} />
      </div>
    );
  }
}
