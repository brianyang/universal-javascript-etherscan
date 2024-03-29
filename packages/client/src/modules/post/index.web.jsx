import React from 'react';
import { Route, NavLink } from 'react-router-dom';
import { MenuItem } from '../../modules/common/components/web';

import Post from './containers/Post';
import PostEdit from './containers/PostEdit';

import resolvers from './resolvers';

import Feature from '../connector';

export default new Feature({
  route: [<Route exact path="/" component={Post} />, <Route exact path="/post/:id" component={PostEdit} />],
  navItem: <MenuItem key="/posts" />,
  resolver: resolvers
});
