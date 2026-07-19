import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	cambiarEstado,
	createExpediente,
	deleteExpediente,
	fetchExpediente,
	fetchExpedientes,
	updateExpediente
} from '../services/expedientesApi';
import type { EstadoExpediente, ExpedienteFiltros, ExpedientePayload } from '../types';

export function useExpedientes(filtros: ExpedienteFiltros) {
	return useQuery({
		queryKey: ['expedientes', filtros],
		queryFn: () => fetchExpedientes(filtros),
		placeholderData: keepPreviousData
	});
}

export function useExpediente(id: number | string | undefined) {
	// Voir useCliente() dans clientes/api/hooks : même normalisation, même raison (id de
	// route en string vs id numérique renvoyé par l'API, sinon invalidateQueries rate la
	// query active après une mutation et la page reste périmée jusqu'au rechargement).
	const idNormalise = id !== undefined ? Number(id) : undefined;
	return useQuery({
		queryKey: ['expediente', idNormalise],
		queryFn: () => fetchExpediente(id!),
		enabled: !!id
	});
}

// Le compteur « Expedientes (n) » de la fiche client (Cliente.nb_dossiers) dépend du
// nombre de dossiers du client — toute création/màj/suppression de dossier doit donc
// aussi invalider le cache clients, sans quoi le compteur reste périmé jusqu'au
// rechargement de la page (invalidation large par préfixe : pas besoin de connaître
// l'id exact du client concerné).
function invaliderClientsEtExpedientes(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: ['expedientes'] });
	queryClient.invalidateQueries({ queryKey: ['clientes'] });
	queryClient.invalidateQueries({ queryKey: ['cliente'] });
}

export function useCreateExpediente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ExpedientePayload) => createExpediente(payload),
		onSuccess: () => invaliderClientsEtExpedientes(queryClient)
	});
}

export function useUpdateExpediente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: Partial<ExpedientePayload> }) =>
			updateExpediente(id, payload),
		onSuccess: (data) => {
			invaliderClientsEtExpedientes(queryClient);
			queryClient.invalidateQueries({ queryKey: ['expediente', data.id] });
		}
	});
}

export function useDeleteExpediente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteExpediente(id),
		onSuccess: () => invaliderClientsEtExpedientes(queryClient)
	});
}

export function useCambiarEstado() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, statut, commentaire }: { id: number; statut: EstadoExpediente; commentaire?: string }) =>
			cambiarEstado(id, statut, commentaire),
		onSuccess: (data) => {
			invaliderClientsEtExpedientes(queryClient);
			queryClient.invalidateQueries({ queryKey: ['expediente', data.id] });
		}
	});
}
