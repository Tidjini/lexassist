export type Cliente = {
	id: number;
	nom: string;
	prenom: string;
	email: string;
	telephone: string;
	adresse: string;
	date_naissance: string | null;
	nationalite: string;
	numero_nie: string;
	numero_passeport: string;
	numero_dni: string;
	notes: string;
	actif: boolean;
	cree_par: { id: number; displayName: string } | null;
	nb_dossiers: number;
	created_at: string;
	updated_at: string;
};

export type ClientePayload = {
	nom: string;
	prenom: string;
	email?: string;
	telephone?: string;
	adresse?: string;
	date_naissance?: string | null;
	nationalite?: string;
	numero_nie?: string;
	numero_passeport?: string;
	numero_dni?: string;
	notes?: string;
	actif?: boolean;
};

export type ClienteFiltros = {
	page?: number;
	search?: string;
	actif?: boolean;
};

export type PaginatedResponse<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};
