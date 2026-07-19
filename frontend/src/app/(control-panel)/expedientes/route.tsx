import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ExpedientesListView = lazy(() => import('./components/views/ExpedientesListView'));
const ExpedienteDetailView = lazy(() => import('./components/views/ExpedienteDetailView'));

const route: FuseRouteItemType[] = [
	{
		path: 'expedientes',
		element: <ExpedientesListView />
	},
	{
		path: 'expedientes/:expedienteId',
		element: <ExpedienteDetailView />
	}
];

export default route;
