import api from '@/utils/api';
import type { EstadoExpediente, Expediente, ExpedienteFiltros, ExpedientePayload, PaginatedResponse } from '../types';

export async function fetchExpedientes(filtros: ExpedienteFiltros = {}): Promise<PaginatedResponse<Expediente>> {
	const searchParams = new URLSearchParams();

	if (filtros.page) searchParams.set('page', String(filtros.page));

	if (filtros.search) searchParams.set('search', filtros.search);

	if (filtros.statut) searchParams.set('statut', filtros.statut);

	if (filtros.cliente) searchParams.set('cliente', String(filtros.cliente));

	const qs = searchParams.toString();
	return api.get(`expedientes/${qs ? `?${qs}` : ''}`).json<PaginatedResponse<Expediente>>();
}

export async function fetchExpediente(id: number | string): Promise<Expediente> {
	return api.get(`expedientes/${id}/`).json<Expediente>();
}

export async function createExpediente(payload: ExpedientePayload): Promise<Expediente> {
	return api.post('expedientes/', { json: payload }).json<Expediente>();
}

export async function updateExpediente(id: number, payload: Partial<ExpedientePayload>): Promise<Expediente> {
	return api.patch(`expedientes/${id}/`, { json: payload }).json<Expediente>();
}

export async function deleteExpediente(id: number): Promise<void> {
	await api.delete(`expedientes/${id}/`);
}

export async function cambiarEstado(id: number, statut: EstadoExpediente, commentaire = ''): Promise<Expediente> {
	return api.post(`expedientes/${id}/changer_statut/`, { json: { statut, commentaire } }).json<Expediente>();
}
