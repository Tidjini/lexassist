import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enviarMensaje, fetchConversacionActual } from '../services/asistenteApi';

export function useConversacionActual() {
	return useQuery({
		queryKey: ['asistente-conversacion'],
		queryFn: fetchConversacionActual
	});
}

export function useEnviarMensaje() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (texto: string) => enviarMensaje(texto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asistente-conversacion'] })
	});
}
