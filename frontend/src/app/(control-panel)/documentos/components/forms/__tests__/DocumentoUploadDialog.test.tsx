import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import DocumentoUploadDialog from '../DocumentoUploadDialog';

const apiMock = vi.hoisted(() => ({
	post: vi.fn(),
	get: vi.fn(),
	patch: vi.fn(),
	delete: vi.fn()
}));

vi.mock('@/utils/api', () => ({
	default: apiMock
}));

describe('DocumentoUploadDialog', () => {
	it('rechaza el envío si no se ha seleccionado ningún archivo', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<DocumentoUploadDialog
				open
				clienteFijo={{ id: 1, label: 'Maria Garcia' }}
				onClose={vi.fn()}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Subir' }));

		expect(await screen.findByText('Seleccione un archivo')).toBeInTheDocument();
		expect(apiMock.post).not.toHaveBeenCalled();
	});

	it('sube el documento seleccionado para el cliente fijado', async () => {
		apiMock.post.mockReturnValue({
			json: () => Promise.resolve({ id: 1, nom_original: 'nie.pdf' })
		});
		const user = userEvent.setup();
		renderWithProviders(
			<DocumentoUploadDialog
				open
				clienteFijo={{ id: 1, label: 'Maria Garcia' }}
				onClose={vi.fn()}
			/>
		);

		const fichero = new File(['contenido'], 'nie.pdf', { type: 'application/pdf' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		await user.upload(input, fichero);

		await user.click(screen.getByRole('button', { name: 'Subir' }));

		await waitFor(() =>
			expect(apiMock.post).toHaveBeenCalledWith(
				'documentos/',
				expect.objectContaining({ body: expect.any(FormData) })
			)
		);
	});

	it('permite subir sin elegir cliente (import en masse)', async () => {
		apiMock.get.mockReturnValue({
			json: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] })
		});
		apiMock.post.mockReturnValue({
			json: () => Promise.resolve({ id: 2, nom_original: 'nie.pdf', cliente: null })
		});
		const user = userEvent.setup();
		renderWithProviders(
			<DocumentoUploadDialog
				open
				onClose={vi.fn()}
			/>
		);

		expect(
			screen.getByText('Déjelo vacío para que la IA determine el cliente automáticamente.')
		).toBeInTheDocument();

		const fichero = new File(['contenido'], 'nie.pdf', { type: 'application/pdf' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		await user.upload(input, fichero);
		await user.click(screen.getByRole('button', { name: 'Subir' }));

		await waitFor(() =>
			expect(apiMock.post).toHaveBeenCalledWith(
				'documentos/',
				expect.objectContaining({ body: expect.any(FormData) })
			)
		);
	});
});
