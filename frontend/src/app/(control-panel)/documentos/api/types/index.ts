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

export const CATEGORIAS: { value: CategoriaDocumento; label: string }[] = [
	{ value: 'PASSEPORT', label: 'Pasaporte' },
	{ value: 'NIE', label: 'NIE' },
	{ value: 'DNI', label: 'DNI' },
	{ value: 'EMPADRONAMIENTO', label: 'Empadronamiento' },
	{ value: 'CONTRAT', label: 'Contrato' },
	{ value: 'VIDA_LABORAL', label: 'Vida laboral' },
	{ value: 'FICHE_PAIE', label: 'Nómina' },
	{ value: 'DIPLOME', label: 'Diploma' },
	{ value: 'CASIER_JUDICIAIRE', label: 'Certificado de antecedentes' },
	{ value: 'AUTRE', label: 'Otro' }
];

export function categoriaLabel(categoria: CategoriaDocumento) {
	return CATEGORIAS.find((c) => c.value === categoria)?.label ?? categoria;
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
