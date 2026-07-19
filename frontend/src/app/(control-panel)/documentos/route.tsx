import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const DocumentosListView = lazy(() => import('./components/views/DocumentosListView'));
const ImportacionMasivaView = lazy(() => import('./components/views/ImportacionMasivaView'));

const route: FuseRouteItemType[] = [
	{
		path: 'documentos',
		element: <DocumentosListView />
	},
	{
		path: 'documentos/importar',
		element: <ImportacionMasivaView />
	}
];

export default route;
