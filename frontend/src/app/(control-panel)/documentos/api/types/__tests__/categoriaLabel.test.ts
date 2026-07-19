import { describe, expect, it } from 'vitest';
import { CATEGORIAS, categoriaLabelKey } from '../index';

describe('categoriaLabelKey', () => {
	it('devuelve la clave de traducción de una categoría conocida', () => {
		expect(categoriaLabelKey('NIE')).toBe('documentos.categoria.NIE');
		expect(categoriaLabelKey('FICHE_PAIE')).toBe('documentos.categoria.FICHE_PAIE');
	});

	it('cubre las 10 categorías del backend (apps/documents/models.py Document.Categorie)', () => {
		expect(CATEGORIAS).toHaveLength(10);
	});
});
