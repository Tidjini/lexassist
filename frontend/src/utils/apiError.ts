import { HTTPError } from 'ky';

/**
 * DRF renvoie soit un tableau de messages (ValidationError sur une chaîne brute),
 * soit un objet {champ: [messages]} (erreurs de validation par champ).
 */
export async function extractErrorMessage(error: unknown): Promise<string> {
	if (error instanceof HTTPError) {
		try {
			const body = await error.response.json();
			if (Array.isArray(body)) {
				return body.join(' ');
			}
			if (body && typeof body === 'object') {
				return Object.values(body).flat().join(' ');
			}
		} catch {
			// réponse non-JSON, on retombe sur le message générique ci-dessous
		}
	}
	return 'Une erreur est survenue. Réessayez.';
}
