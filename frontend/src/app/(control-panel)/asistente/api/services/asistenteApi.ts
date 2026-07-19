import api from '@/utils/api';
import type { Conversacion, EnviarMensajeResponse } from '../types';

export async function fetchConversacionActual(): Promise<Conversacion> {
	return api.get('asistente/conversaciones/actual/').json<Conversacion>();
}

export async function enviarMensaje(texto: string): Promise<EnviarMensajeResponse> {
	return api.post('asistente/conversaciones/enviar_mensaje/', { json: { texto } }).json<EnviarMensajeResponse>();
}
