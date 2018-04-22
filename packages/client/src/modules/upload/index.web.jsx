import React from 'react';
import { Route, NavLink } from 'react-router-dom';
import { createApolloFetch } from 'apollo-fetch';
import { constructUploadOptions } from 'apollo-fetch-upload';

import { MenuItem } from '../../modules/common/components/web';
import Upload from './containers/Upload';
import reducers from './reducers';
import Feature from '../connector';

export default new Feature({
  catalogInfo: { upload: true },
  route: <Route exact path="/upload" component={Upload} />,
  navItem: <MenuItem key="/upload" />,
  reducer: { upload: reducers },
  createFetch: uri =>
    createApolloFetch({
      uri,
      constructOptions: (reqs, options) => ({
        ...constructUploadOptions(reqs, options),
        credentials: 'include'
      })
    })
});
