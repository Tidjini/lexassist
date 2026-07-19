import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/utils/api';
import type { Notificacion } from './notificacionesApi';

const CLAVE_TOKEN = 'jwt_access_token';
const RETRASO_RECONEXION_MS = 5000;

function obtenerToken(): string | null {
	try {
		const item = window.localStorage.getItem(CLAVE_TOKEN);
		return item ? (JSON.parse(item) as string) : null;
	} catch {
		return null;
	}
}

/**
 * Écoute ws://.../ws/notifications/?token=<jwt> (apps.notifications.consumers,
 * NotificationConsumer déjà en place côté serveur — voir apps.notifications.utils.
 * notificar). Le consumer envoie soit un message système ({"type": "connected"|
 * "warning", ...}), soit directement le payload de la notification (sans clé "type" —
 * cf. `event["data"]` dans NotificationConsumer.notification) : on distingue les deux
 * par la présence de `mensaje`.
 *
 * Reconnexion basique après une coupure — suffisant pour cette passe (pas de backoff
 * exponentiel).
 */
export function useNotificacionesSocket(onNotificacion?: (notificacion: Notificacion) => void) {
	const queryClient = useQueryClient();
	const callbackRef = useRef(onNotificacion);

	// Séparé de l'effet de connexion ci-dessous : on ne veut pas rouvrir le WebSocket
	// juste parce que l'appelant a passé une nouvelle closure inline à chaque rendu.
	useEffect(() => {
		callbackRef.current = onNotificacion;
	}, [onNotificacion]);

	useEffect(() => {
		const token = obtenerToken();

		if (!token) return undefined;

		let fermeVolontairement = false;
		let socket: WebSocket | null = null;
		let reintentoId: ReturnType<typeof setTimeout> | undefined;

		function conectar() {
			const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/notifications/?token=${encodeURIComponent(token as string)}`;
			socket = new WebSocket(wsUrl);

			socket.onmessage = (event) => {
				let mensaje: unknown;

				try {
					mensaje = JSON.parse(event.data as string);
				} catch {
					return;
				}

				if (mensaje && typeof mensaje === 'object' && 'mensaje' in mensaje) {
					queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
					callbackRef.current?.(mensaje as Notificacion);
				}
			};

			socket.onclose = () => {
				if (!fermeVolontairement) {
					reintentoId = setTimeout(conectar, RETRASO_RECONEXION_MS);
				}
			};
		}

		conectar();

		return () => {
			fermeVolontairement = true;
			clearTimeout(reintentoId);
			socket?.close();
		};
	}, [queryClient]);
}
