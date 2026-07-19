import api from '@/utils/api';
import type { Cliente, ClienteFiltros, ClientePayload, PaginatedResponse } from '../types';

export async function fetchClientes(filtros: ClienteFiltros = {}): Promise<PaginatedResponse<Cliente>> {
	const searchParams = new URLSearchParams();

	if (filtros.page) searchParams.set('page', String(filtros.page));

	if (filtros.search) searchParams.set('search', filtros.search);

	if (filtros.actif !== undefined) searchParams.set('actif', String(filtros.actif));

	const qs = searchParams.toString();
	return api.get(`clientes/${qs ? `?${qs}` : ''}`).json<PaginatedResponse<Cliente>>();
}

export async function fetchCliente(id: number | string): Promise<Cliente> {
	return api.get(`clientes/${id}/`).json<Cliente>();
}

export async function createCliente(payload: ClientePayload): Promise<Cliente> {
	return api.post('clientes/', { json: payload }).json<Cliente>();
}

export async function updateCliente(id: number, payload: Partial<ClientePayload>): Promise<Cliente> {
	return api.patch(`clientes/${id}/`, { json: payload }).json<Cliente>();
}

export async function deleteCliente(id: number): Promise<void> {
	await api.delete(`clientes/${id}/`);
}
