import React from 'react';
import PropTypes from 'prop-types';
import { withFormik } from 'formik';
import Field from '../../../utils/FieldAdapter';
import { Form, RenderField, Row, Col, Label, Button } from '../../common/components/web';
import { required, validateForm } from '../../../../../common/validation';

const transactionFormSchema = {
  content: [required]
};

const validate = values => validateForm(values, transactionFormSchema);

const PostTransactionForm = ({ values, handleSubmit, transaction }) => {
  return (
    <Form name="transaction" onSubmit={handleSubmit}>
      <Row>
        <Col xs={10} />
        <Col xs={2}>
          <Button color="primary" type="submit" className="float-right">
            Get Transactions
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

PostTransactionForm.propTypes = {
  handleSubmit: PropTypes.func,
  transaction: PropTypes.object,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  values: PropTypes.object,
  content: PropTypes.string,
  changeContent: PropTypes.func
};

const PostTransactionFormWithFormik = withFormik({
  mapPropsToValues: props => ({ content: props.transaction && props.transaction.content }),
  async handleSubmit(values, { resetForm, props: { onSubmit } }) {
    await onSubmit(values);
    resetForm({ content: '' });
  },
  // validate: values => validate(values),
  displayName: 'TransactionForm', // helps with React DevTools,
  enableReinitialize: true
});

export default PostTransactionFormWithFormik(PostTransactionForm);
