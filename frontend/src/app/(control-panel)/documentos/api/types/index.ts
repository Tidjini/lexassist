export type CategoriaDocumento =
	| 'PASSEPORT'
	| 'NIE'
	| 'DNI'
	| 'EMPADRONAMIENTO'
	| 'CONTRAT'
	| 'VIDA_LABORAL'
	| 'FICHE_PAIE'
	| 'DIPLOME'
	| 'CASIER_JUDICIAIRE'
	| 'AUTRE';

// labelKey pointe vers une clé de traduction (namespace documentos.categoria.*)
// plutôt que du texte en dur — le libellé affiché dépend de la langue (ES/FR).
export const CATEGORIAS: { value: CategoriaDocumento; labelKey: string }[] = [
	{ value: 'PASSEPORT', labelKey: 'documentos.categoria.PASSEPORT' },
	{ value: 'NIE', labelKey: 'documentos.categoria.NIE' },
	{ value: 'DNI', labelKey: 'documentos.categoria.DNI' },
	{ value: 'EMPADRONAMIENTO', labelKey: 'documentos.categoria.EMPADRONAMIENTO' },
	{ value: 'CONTRAT', labelKey: 'documentos.categoria.CONTRAT' },
	{ value: 'VIDA_LABORAL', labelKey: 'documentos.categoria.VIDA_LABORAL' },
	{ value: 'FICHE_PAIE', labelKey: 'documentos.categoria.FICHE_PAIE' },
	{ value: 'DIPLOME', labelKey: 'documentos.categoria.DIPLOME' },
	{ value: 'CASIER_JUDICIAIRE', labelKey: 'documentos.categoria.CASIER_JUDICIAIRE' },
	{ value: 'AUTRE', labelKey: 'documentos.categoria.AUTRE' }
];

export function categoriaLabelKey(categoria: CategoriaDocumento) {
	return CATEGORIAS.find((c) => c.value === categoria)?.labelKey ?? 'documentos.categoria.AUTRE';
}

export type EstadoIA = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR' | 'SIN_CLAVE' | 'SIMULADO';

export const ESTADOS_IA: {
	value: EstadoIA;
	labelKey: string;
	color: 'default' | 'info' | 'success' | 'error' | 'warning' | 'secondary';
}[] = [
	{ value: 'PENDIENTE', labelKey: 'documentos.ia.estadoPendiente', color: 'default' },
	{ value: 'PROCESANDO', labelKey: 'documentos.ia.estadoProcesando', color: 'info' },
	{ value: 'COMPLETADO', labelKey: 'documentos.ia.estadoCompletado', color: 'success' },
	{ value: 'ERROR', labelKey: 'documentos.ia.estadoError', color: 'error' },
	{ value: 'SIN_CLAVE', labelKey: 'documentos.ia.estadoSinClave', color: 'warning' },
	// IA_MODO_SIMULADO côté serveur (voir apps.documents.vision.analizar_documento_
	// simulado) : résultat fabriqué à partir du nom de fichier, jamais une vraie analyse
	// — couleur distincte de COMPLETADO pour ne jamais laisser croire à une vraie analyse.
	{ value: 'SIMULADO', labelKey: 'documentos.ia.estadoSimulado', color: 'secondary' }
];

export function estadoIaInfo(estado: EstadoIA) {
	return ESTADOS_IA.find((e) => e.value === estado);
}

export type CamposExtraidos = {
	nombre?: string | null;
	apellidos?: string | null;
	numero_documento?: string | null;
	fecha_nacimiento?: string | null;
	nacionalidad?: string | null;
};

export type Documento = {
	id: number;
	// null : document importé sans client choisi (import en masse) — procesar_documento
	// tente alors de le rattacher à un client existant ou d'en créer un.
	cliente: number | null;
	cliente_nom_complet: string;
	cliente_confirmado: boolean;
	dossier: number | null;
	fichier: string;
	nom_original: string;
	categorie: CategoriaDocumento;
	taille: number;
	content_type: string;
	televerse_par: { id: number; displayName: string } | null;
	created_at: string;
	updated_at: string;
	estado_ia: EstadoIA;
	categoria_sugerida: CategoriaDocumento | '';
	datos_extraidos: CamposExtraidos;
	fecha_expiracion: string | null;
	error_ia: string;
};

export type AlertaDocumento = {
	id: number;
	cliente: number;
	cliente_nom_complet: string;
	nom_original: string;
	categorie: CategoriaDocumento;
	fecha_expiracion: string;
	dias_restantes: number;
};

export type DocumentoFiltros = {
	page?: number;
	cliente?: number;
	dossier?: number;
	categorie?: CategoriaDocumento;
};

export type PaginatedResponse<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};
