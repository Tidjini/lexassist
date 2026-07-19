import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCliente, deleteCliente, fetchCliente, fetchClientes, updateCliente } from '../services/clientesApi';
import type { ClienteFiltros, ClientePayload } from '../types';

export function useClientes(filtros: ClienteFiltros, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['clientes', filtros],
		queryFn: () => fetchClientes(filtros),
		enabled: options?.enabled,
		placeholderData: keepPreviousData
	});
}

export function useCliente(id: number | string | undefined) {
	return useQuery({
		queryKey: ['cliente', id],
		queryFn: () => fetchCliente(id!),
		enabled: !!id
	});
}

export function useCreateCliente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ClientePayload) => createCliente(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })
	});
}

export function useUpdateCliente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: Partial<ClientePayload> }) => updateCliente(id, payload),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['clientes'] });
			queryClient.invalidateQueries({ queryKey: ['cliente', data.id] });
		}
	});
}

export function useDeleteCliente() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteCliente(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })
	});
}
