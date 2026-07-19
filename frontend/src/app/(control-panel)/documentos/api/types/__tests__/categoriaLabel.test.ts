import { describe, expect, it } from 'vitest';
import { CATEGORIAS, categoriaLabel } from '../index';

describe('categoriaLabel', () => {
	it('devuelve la etiqueta en español de una categoría conocida', () => {
		expect(categoriaLabel('NIE')).toBe('NIE');
		expect(categoriaLabel('FICHE_PAIE')).toBe('Nómina');
	});

	it('cubre las 10 categorías del backend (apps/documents/models.py Document.Categorie)', () => {
		expect(CATEGORIAS).toHaveLength(10);
	});
});
