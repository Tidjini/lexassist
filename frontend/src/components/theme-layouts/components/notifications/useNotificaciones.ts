import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eliminarNotificacion, fetchNotificaciones, marcarLeida } from './notificacionesApi';

// Polling (pas de client WebSocket pour cette passe — le consumer Channels côté serveur
// existe déjà pour plus tard, voir apps.notifications.consumers).
const INTERVALO_POLLING = 15000;

export function useNotificaciones() {
	return useQuery({
		queryKey: ['notificaciones'],
		queryFn: fetchNotificaciones,
		refetchInterval: INTERVALO_POLLING
	});
}

export function useMarcarLeida() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => marcarLeida(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
	});
}

export function useEliminarNotificacion() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => eliminarNotificacion(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
	});
}
