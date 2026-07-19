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

export type Documento = {
	id: number;
	cliente: number;
	dossier: number | null;
	fichier: string;
	nom_original: string;
	categorie: CategoriaDocumento;
	taille: number;
	content_type: string;
	televerse_par: { id: number; displayName: string } | null;
	created_at: string;
	updated_at: string;
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
