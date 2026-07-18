import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const DocumentosView = lazy(() => import('./DocumentosView'));

const route: FuseRouteItemType = {
	path: 'documentos',
	element: <DocumentosView />
};

export default route;
