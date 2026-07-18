import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 * Libellés en espagnol (interface cliente) — cf. docs/PLAN_ACTION.md.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'inicio',
		title: 'Inicio',
		type: 'item',
		icon: 'lucide:home',
		url: '/inicio'
	},
	{
		id: 'clientes',
		title: 'Clientes',
		type: 'item',
		icon: 'lucide:users',
		url: '/clientes'
	},
	{
		id: 'expedientes',
		title: 'Expedientes',
		type: 'item',
		icon: 'lucide:folder-open',
		url: '/expedientes'
	},
	{
		id: 'documentos',
		title: 'Documentos',
		type: 'item',
		icon: 'lucide:file-text',
		url: '/documentos'
	}
];

export default navigationConfig;
