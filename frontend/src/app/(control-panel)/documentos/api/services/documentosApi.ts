import api from '@/utils/api';
import type { AlertaDocumento, CategoriaDocumento, Documento, DocumentoFiltros, PaginatedResponse } from '../types';

export async function fetchDocumentos(filtros: DocumentoFiltros = {}): Promise<PaginatedResponse<Documento>> {
	const searchParams = new URLSearchParams();

	if (filtros.page) searchParams.set('page', String(filtros.page));

	if (filtros.cliente) searchParams.set('cliente', String(filtros.cliente));

	if (filtros.dossier) searchParams.set('dossier', String(filtros.dossier));

	if (filtros.categorie) searchParams.set('categorie', filtros.categorie);

	const qs = searchParams.toString();
	return api.get(`documentos/${qs ? `?${qs}` : ''}`).json<PaginatedResponse<Documento>>();
}

export type SubirDocumentoPayload = {
	cliente: number;
	dossier?: number;
	categorie: CategoriaDocumento;
	fichier: File;
};

export async function subirDocumento(payload: SubirDocumentoPayload): Promise<Documento> {
	const datos = new FormData();
	datos.set('cliente', String(payload.cliente));

	if (payload.dossier) datos.set('dossier', String(payload.dossier));

	datos.set('categorie', payload.categorie);
	datos.set('fichier', payload.fichier);

	return api.post('documentos/', { body: datos }).json<Documento>();
}

export async function deleteDocumento(id: number): Promise<void> {
	await api.delete(`documentos/${id}/`);
}

export type AplicarAClientePayload = {
	campos: string[];
	aplicar_categoria: boolean;
};

export async function aplicarACliente(id: number, payload: AplicarAClientePayload): Promise<unknown> {
	return api.post(`documentos/${id}/aplicar_a_cliente/`, { json: payload }).json();
}

export async function fetchAlertas(): Promise<AlertaDocumento[]> {
	return api.get('documentos/alertas/').json<AlertaDocumento[]>();
}
