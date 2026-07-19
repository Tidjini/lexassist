import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	aplicarACliente,
	asignarCliente,
	confirmarCliente,
	deleteDocumento,
	fetchAlertas,
	fetchDocumentos,
	fetchSinClasificar,
	subirDocumento,
	type AplicarAClientePayload
} from '../services/documentosApi';
import type { DocumentoFiltros } from '../types';

export function useDocumentos(filtros: DocumentoFiltros) {
	return useQuery({
		queryKey: ['documentos', filtros],
		queryFn: () => fetchDocumentos(filtros),
		placeholderData: keepPreviousData
	});
}

export function useSubirDocumento() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: subirDocumento,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['documentos'] });
			queryClient.invalidateQueries({ queryKey: ['documentos-sin-clasificar'] });
			queryClient.invalidateQueries({ queryKey: ['clientes'] });
			// En mode eager (pas de worker Celery, cf. CELERY_TASK_ALWAYS_EAGER), le
			// traitement IA — et donc la notification — est déjà terminé quand la
			// réponse d'upload revient : autant rafraîchir tout de suite plutôt que
			// d'attendre le polling (15s, voir useNotificaciones).
			queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
		}
	});
}

export function useDeleteDocumento() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteDocumento(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos'] })
	});
}

export function useAplicarACliente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: AplicarAClientePayload }) => aplicarACliente(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['documentos'] });
			queryClient.invalidateQueries({ queryKey: ['clientes'] });
			queryClient.invalidateQueries({ queryKey: ['cliente'] });
		}
	});
}

function invalidarTrasCambioDeCliente(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: ['documentos'] });
	queryClient.invalidateQueries({ queryKey: ['documentos-sin-clasificar'] });
	queryClient.invalidateQueries({ queryKey: ['clientes'] });
}

export function useConfirmarCliente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => confirmarCliente(id),
		onSuccess: () => invalidarTrasCambioDeCliente(queryClient)
	});
}

export function useAsignarCliente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, cliente }: { id: number; cliente: number }) => asignarCliente(id, cliente),
		onSuccess: () => invalidarTrasCambioDeCliente(queryClient)
	});
}

export function useSinClasificar() {
	return useQuery({
		queryKey: ['documentos-sin-clasificar'],
		queryFn: fetchSinClasificar
	});
}

export function useAlertas() {
	return useQuery({
		queryKey: ['documentos-alertas'],
		queryFn: fetchAlertas
	});
}
