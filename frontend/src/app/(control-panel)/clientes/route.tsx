import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ClientesView = lazy(() => import('./ClientesView'));

const route: FuseRouteItemType = {
	path: 'clientes',
	element: <ClientesView />
};

export default route;
