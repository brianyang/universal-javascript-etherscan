import React from 'react';
import PropTypes from 'prop-types';
import { withFormik } from 'formik';
import Field from '../../../utils/FieldAdapter';
import { FormView, RenderField, FormButton } from '../../common/components/native';
import { required, validateForm } from '../../../../../common/validation';

const transactionFormSchema = {
  content: [required]
};

const validate = values => validateForm(values, transactionFormSchema);

const PostTransactionForm = ({ values, handleSubmit, transaction }) => {
  let operation = 'Add';
  if (transaction.id !== null) {
    operation = 'Edit';
  }

  return (
    <FormView>
      <Field name="content" component={RenderField} type="text" value={values.content} placeholder="Transaction" />
      <FormButton onPress={handleSubmit}>{operation}</FormButton>
    </FormView>
  );
};

PostTransactionForm.propTypes = {
  handleSubmit: PropTypes.func,
  transaction: PropTypes.object,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  values: PropTypes.object
};

const PostTransactionFormWithFormik = withFormik({
  mapPropsToValues: props => ({ content: props.transaction && props.transaction.content }),
  validate: values => validate(values),
  handleSubmit: async (values, { resetForm, props: { onSubmit } }) => {
    await onSubmit(values);
    resetForm({ content: '' });
  },
  displayName: 'TransactionForm', // helps with React DevTools
  enableReinitialize: true
});

export default PostTransactionFormWithFormik(PostTransactionForm);
