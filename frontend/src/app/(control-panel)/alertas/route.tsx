import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const AlertasListView = lazy(() => import('./components/views/AlertasListView'));

const route: FuseRouteItemType = {
	path: 'alertas',
	element: <AlertasListView />
};

export default route;
