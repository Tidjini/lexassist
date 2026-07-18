import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const InicioView = lazy(() => import('./components/views/InicioView'));

const route: FuseRouteItemType = {
	path: 'inicio',
	element: <InicioView />
};

export default route;
