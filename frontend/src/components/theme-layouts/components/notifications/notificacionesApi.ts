import api from '@/utils/api';

export type Notificacion = {
	id: number;
	tipo: 'DOCUMENTO_PROCESADO' | 'DOCUMENTO_ERROR';
	mensaje: string;
	documento: number | null;
	leida: boolean;
	created_at: string;
};

type PaginatedResponse<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};

export async function fetchNotificaciones(): Promise<PaginatedResponse<Notificacion>> {
	return api.get('notificaciones/').json<PaginatedResponse<Notificacion>>();
}

export async function marcarLeida(id: number): Promise<Notificacion> {
	return api.post(`notificaciones/${id}/marcar_leida/`).json<Notificacion>();
}

export async function eliminarNotificacion(id: number): Promise<void> {
	await api.delete(`notificaciones/${id}/`);
}
