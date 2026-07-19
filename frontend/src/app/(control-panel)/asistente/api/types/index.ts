export type RolMensaje = 'USUARIO' | 'ASISTENTE';

export type Mensaje = {
	id: number;
	rol: RolMensaje;
	contenido: string;
	created_at: string;
};

export type Conversacion = {
	id: number;
	titulo: string;
	mensajes: Mensaje[];
	created_at: string;
	updated_at: string;
};

export type EnviarMensajeResponse = {
	conversacion: Conversacion;
	// Présent uniquement si le serveur n'a pas pu appeler l'IA (ANTHROPIC_API_KEY absente) —
	// le message utilisateur est quand même enregistré (visible dans conversacion.mensajes),
	// seule la réponse de l'assistant manque. Voir apps.assistant.service.responder.
	error?: 'SIN_CLAVE';
	detalle?: string;
};
