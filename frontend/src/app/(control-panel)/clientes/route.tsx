import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ClientesListView = lazy(() => import('./components/views/ClientesListView'));
const ClienteDetailView = lazy(() => import('./components/views/ClienteDetailView'));

const route: FuseRouteItemType[] = [
	{
		path: 'clientes',
		element: <ClientesListView />
	},
	{
		path: 'clientes/:clienteId',
		element: <ClienteDetailView />
	}
];

export default route;
