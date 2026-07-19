import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import DocumentoValidacionIA from '../DocumentoValidacionIA';
import type { Documento } from '../../../api/types';

const apiMock = vi.hoisted(() => ({
	post: vi.fn(),
	get: vi.fn(),
	patch: vi.fn(),
	delete: vi.fn()
}));

vi.mock('@/utils/api', () => ({
	default: apiMock
}));

const documentoBase: Documento = {
	id: 42,
	cliente: 1,
	dossier: null,
	fichier: 'https://example.com/nie.pdf',
	nom_original: 'nie.pdf',
	categorie: 'AUTRE',
	taille: 1234,
	content_type: 'application/pdf',
	televerse_par: null,
	created_at: '2026-07-19T00:00:00Z',
	updated_at: '2026-07-19T00:00:00Z',
	estado_ia: 'COMPLETADO',
	categoria_sugerida: 'NIE',
	datos_extraidos: {
		nombre: 'Maria',
		apellidos: 'Garcia',
		numero_documento: null,
		fecha_nacimiento: null,
		nacionalidad: null
	},
	fecha_expiracion: null,
	error_ia: ''
};

describe('DocumentoValidacionIA', () => {
	it('desactiva "Aplicar al cliente" mientras no haya ningún campo seleccionado', () => {
		renderWithProviders(<DocumentoValidacionIA documento={documentoBase} />);

		expect(screen.getByRole('button', { name: 'Aplicar al cliente' })).toBeDisabled();
	});

	it('aplica solo los campos marcados', async () => {
		apiMock.post.mockReturnValue({ json: () => Promise.resolve({}) });
		const user = userEvent.setup();
		renderWithProviders(<DocumentoValidacionIA documento={documentoBase} />);

		await user.click(screen.getByLabelText(/Nombre: Maria/));
		await user.click(screen.getByRole('button', { name: 'Aplicar al cliente' }));

		await waitFor(() =>
			expect(apiMock.post).toHaveBeenCalledWith(
				'documentos/42/aplicar_a_cliente/',
				expect.objectContaining({ json: { campos: ['nombre'], aplicar_categoria: false } })
			)
		);
	});

	it('el estado SIN_CLAVE muestra el motivo en lugar del formulario', () => {
		renderWithProviders(
			<DocumentoValidacionIA
				documento={{
					...documentoBase,
					estado_ia: 'SIN_CLAVE',
					error_ia: "ANTHROPIC_API_KEY n'est pas configurée côté serveur (voir .env)."
				}}
			/>
		);

		expect(screen.getByText(/ANTHROPIC_API_KEY/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Aplicar al cliente' })).not.toBeInTheDocument();
	});
});
