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
	return useQuery({
		queryKey: ['expediente', id],
		queryFn: () => fetchExpediente(id!),
		enabled: !!id
	});
}

export function useCreateExpediente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ExpedientePayload) => createExpediente(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expedientes'] })
	});
}

export function useUpdateExpediente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: Partial<ExpedientePayload> }) =>
			updateExpediente(id, payload),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['expedientes'] });
			queryClient.invalidateQueries({ queryKey: ['expediente', data.id] });
		}
	});
}

export function useDeleteExpediente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteExpediente(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expedientes'] })
	});
}

export function useCambiarEstado() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, statut, commentaire }: { id: number; statut: EstadoExpediente; commentaire?: string }) =>
			cambiarEstado(id, statut, commentaire),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['expedientes'] });
			queryClient.invalidateQueries({ queryKey: ['expediente', data.id] });
		}
	});
}
