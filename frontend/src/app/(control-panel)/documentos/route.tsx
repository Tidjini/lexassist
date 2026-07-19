import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const DocumentosListView = lazy(() => import('./components/views/DocumentosListView'));

const route: FuseRouteItemType = {
	path: 'documentos',
	element: <DocumentosListView />
};

export default route;
