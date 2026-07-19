export type EstadoExpediente = 'PREPARATION' | 'DEPOSE' | 'REQUERIMIENTO' | 'RESOLU';

// labelKey pointe vers une clé de traduction (namespace expedientes.*) plutôt que du
// texte en dur — le libellé affiché dépend de la langue choisie (ES/FR).
export const ESTADOS: {
	value: EstadoExpediente;
	labelKey: string;
	color: 'default' | 'info' | 'warning' | 'success';
}[] = [
	{ value: 'PREPARATION', labelKey: 'expedientes.estadoPreparacion', color: 'default' },
	{ value: 'DEPOSE', labelKey: 'expedientes.estadoPresentado', color: 'info' },
	{ value: 'REQUERIMIENTO', labelKey: 'expedientes.estadoRequerimiento', color: 'warning' },
	{ value: 'RESOLU', labelKey: 'expedientes.estadoResuelto', color: 'success' }
];

export function estadoInfo(estado: EstadoExpediente) {
	return ESTADOS.find((e) => e.value === estado);
}

export type EventoExpediente = {
	id: number;
	ancien_statut: EstadoExpediente | '';
	nouveau_statut: EstadoExpediente;
	commentaire: string;
	auteur: { id: number; displayName: string } | null;
	created_at: string;
};

export type Expediente = {
	id: number;
	cliente: number;
	cliente_nom_complet: string;
	titre: string;
	type_procedure: string;
	statut: EstadoExpediente;
	date_ouverture: string;
	date_cloture: string | null;
	notes: string;
	cree_par: { id: number; displayName: string } | null;
	created_at: string;
	updated_at: string;
	evenements?: EventoExpediente[];
};

export type ExpedientePayload = {
	cliente: number;
	titre: string;
	type_procedure?: string;
	notes?: string;
};

export type ExpedienteFiltros = {
	page?: number;
	search?: string;
	statut?: EstadoExpediente;
	cliente?: number;
};

export type PaginatedResponse<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};
