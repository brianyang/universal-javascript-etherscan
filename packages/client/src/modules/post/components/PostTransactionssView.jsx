import React from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  FlatList,
  Text,
  View,
  Keyboard,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SwipeAction } from '../../common/components/native';

import PostTransactionForm from './PostTransactionForm';

export default class PostTransactionsView extends React.PureComponent {
  static propTypes = {
    postId: PropTypes.number.isRequired,
    transactions: PropTypes.array.isRequired,
    transaction: PropTypes.object,
    addTransaction: PropTypes.func.isRequired,
    editTransaction: PropTypes.func.isRequired,
    deleteTransaction: PropTypes.func.isRequired,
    subscribeToMore: PropTypes.func.isRequired,
    onTransactionSelect: PropTypes.func.isRequired
  };

  keyExtractor = item => item.id;

  renderItemIOS = ({ item: { id, content } }) => {
    const { transaction, deleteTransaction, onTransactionSelect } = this.props;
    return (
      <SwipeAction
        onPress={() => onTransactionSelect({ id: id, content: content })}
        right={{
          text: 'Delete',
          onPress: () => this.onTransactionDelete(transaction, deleteTransaction, onTransactionSelect, id)
        }}
      >
        {content}
      </SwipeAction>
    );
  };

  renderItemAndroid = ({ item: { id, content } }) => {
    const { deleteTransaction, onTransactionSelect, transaction } = this.props;
    return (
      <TouchableWithoutFeedback onPress={() => onTransactionSelect({ id: id, content: content })}>
        <View style={styles.postWrapper}>
          <Text style={styles.text}>{content}</Text>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => this.onTransactionDelete(transaction, deleteTransaction, onTransactionSelect, id)}
          >
            <FontAwesome name="trash" size={20} style={{ color: '#3B5998' }} />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  onTransactionDelete = (transaction, deleteTransaction, onTransactionSelect, id) => {
    if (transaction.id === id) {
      onTransactionSelect({ id: null, content: '' });
    }

    deleteTransaction(id);
  };

  onSubmit = (transaction, postId, addTransaction, editTransaction, onTransactionSelect) => values => {
    if (transaction.id === null) {
      addTransaction(values.content, postId);
    } else {
      editTransaction(transaction.id, values.content);
    }

    onTransactionSelect({ id: null, content: '' });
    Keyboard.dismiss();
  };

  render() {
    const { postId, transaction, addTransaction, editTransaction, transactions, onTransactionSelect } = this.props;
    const renderItem = Platform.OS === 'android' ? this.renderItemAndroid : this.renderItemIOS;

    return (
      <View>
        <Text style={styles.title}>Transactions</Text>
        <PostTransactionForm
          postId={postId}
          onSubmit={this.onSubmit(transaction, postId, addTransaction, editTransaction, onTransactionSelect)}
          transaction={transaction}
        />
        {transactions.length > 0 && (
          <View style={styles.list} keyboardDismissMode="on-drag">
            <FlatList data={transactions} keyExtractor={this.keyExtractor} renderItem={renderItem} />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    margin: 10
  },
  list: {
    paddingTop: 10
  },
  text: {
    fontSize: 18
  },
  iconWrapper: {
    backgroundColor: 'transparent',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  postWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#000',
    borderBottomWidth: 0.3,
    height: 50,
    paddingLeft: 7
  }
});
