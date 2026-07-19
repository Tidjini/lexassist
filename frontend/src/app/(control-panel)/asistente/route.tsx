import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const AsistenteView = lazy(() => import('./components/views/AsistenteView'));

const route: FuseRouteItemType = {
	path: 'asistente',
	element: <AsistenteView />
};

export default route;
