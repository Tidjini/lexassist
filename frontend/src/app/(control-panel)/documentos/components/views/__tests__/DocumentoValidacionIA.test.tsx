import { beforeEach, describe, expect, it, vi } from 'vitest';
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
	cliente_nom_complet: 'Maria Garcia',
	cliente_confirmado: true,
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

beforeEach(() => {
	apiMock.get.mockReturnValue({
		json: () => Promise.resolve({ id: 1, nom: 'Garcia', prenom: 'Maria' })
	});
});

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

	it('sin cliente asignado, muestra un sélecteur de client au lieu des champs extraits', () => {
		renderWithProviders(
			<DocumentoValidacionIA documento={{ ...documentoBase, cliente: null, cliente_confirmado: true }} />
		);

		expect(screen.getByLabelText('Buscar cliente')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Aplicar al cliente' })).not.toBeInTheDocument();
	});

	it('cliente no confirmado : propose Confirmar / Cambiar cliente', async () => {
		renderWithProviders(<DocumentoValidacionIA documento={{ ...documentoBase, cliente_confirmado: false }} />);

		await waitFor(() => expect(screen.getByText('Cliente: Maria Garcia')).toBeInTheDocument());
		expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cambiar cliente' })).toBeInTheDocument();
	});

	it('confirmar cliente llama a la acción confirmar_cliente', async () => {
		apiMock.post.mockReturnValue({ json: () => Promise.resolve({}) });
		const user = userEvent.setup();
		renderWithProviders(<DocumentoValidacionIA documento={{ ...documentoBase, cliente_confirmado: false }} />);

		await waitFor(() => screen.getByRole('button', { name: 'Confirmar' }));
		await user.click(screen.getByRole('button', { name: 'Confirmar' }));

		await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith('documentos/42/confirmar_cliente/'));
	});

	it('asignar un cliente affiche son nom sans attendre un rechargement du parent', async () => {
		const documentoAsigne: Documento = {
			...documentoBase,
			cliente: 7,
			cliente_nom_complet: 'Juan Perez',
			cliente_confirmado: false
		};
		apiMock.patch.mockReturnValue({ json: () => Promise.resolve(documentoAsigne) });
		apiMock.get.mockImplementation((url: string) => {
			if (url.startsWith('clientes/7')) {
				return { json: () => Promise.resolve({ id: 7, nom: 'Perez', prenom: 'Juan' }) };
			}

			return { json: () => Promise.resolve({ results: [{ id: 7, nom: 'Perez', prenom: 'Juan' }] }) };
		});
		const user = userEvent.setup();
		renderWithProviders(<DocumentoValidacionIA documento={{ ...documentoBase, cliente: null }} />);

		const searchBox = screen.getByRole('combobox', { name: 'Buscar cliente' });
		await user.type(searchBox, 'Perez');
		await waitFor(() => screen.getByText('Juan Perez'));
		await user.click(screen.getByText('Juan Perez'));
		await user.click(screen.getByRole('button', { name: 'Asignar' }));

		await waitFor(() => expect(screen.getByText('Cliente: Juan Perez')).toBeInTheDocument());
	});
});
