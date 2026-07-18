import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ExpedientesView = lazy(() => import('./ExpedientesView'));

const route: FuseRouteItemType = {
	path: 'expedientes',
	element: <ExpedientesView />
};

export default route;
