import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteDocumento, fetchDocumentos, subirDocumento } from '../services/documentosApi';
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
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos'] })
	});
}

export function useDeleteDocumento() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteDocumento(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos'] })
	});
}
