import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * Construit la navigation avec des libellés traduits (ES par défaut, FR en
 * option — cf. @i18n). `t` vient de useTranslation() ; voir
 * NavigationContextProvider, qui reconstruit cette liste à chaque changement
 * de langue (pas d'export statique ici : la navigation n'existe qu'en
 * fonction de la langue courante).
 */
export function buildNavigationConfig(t: (key: string) => string): FuseNavItemType[] {
	return [
		{
			id: 'inicio',
			title: t('inicio.tituloPagina'),
			type: 'item',
			icon: 'lucide:home',
			url: '/inicio'
		},
		{
			id: 'clientes',
			title: t('clientes.tituloPagina'),
			type: 'item',
			icon: 'lucide:users',
			url: '/clientes'
		},
		{
			id: 'expedientes',
			title: t('expedientes.tituloPagina'),
			type: 'item',
			icon: 'lucide:folder-open',
			url: '/expedientes'
		},
		{
			id: 'documentos',
			title: t('documentos.tituloPagina'),
			type: 'item',
			icon: 'lucide:file-text',
			url: '/documentos'
		}
	];
}
