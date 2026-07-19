import { beforeEach, describe, expect, it, vi } from 'vitest';
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
	beforeEach(() => {
		apiMock.post.mockClear();
		apiMock.get.mockClear();
	});

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

		expect(await screen.findByText('Seleccione al menos un archivo')).toBeInTheDocument();
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

	it('permite seleccionar varios archivos a la vez y los sube todos', async () => {
		apiMock.post.mockReturnValue({
			json: () => Promise.resolve({ id: 1, nom_original: 'doc.pdf' })
		});
		const user = userEvent.setup();
		const onClose = vi.fn();
		renderWithProviders(
			<DocumentoUploadDialog
				open
				clienteFijo={{ id: 1, label: 'Maria Garcia' }}
				onClose={onClose}
			/>
		);

		const ficheros = [
			new File(['a'], 'a.pdf', { type: 'application/pdf' }),
			new File(['b'], 'b.pdf', { type: 'application/pdf' })
		];
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		await user.upload(input, ficheros);

		expect(screen.getByText('a.pdf')).toBeInTheDocument();
		expect(screen.getByText('b.pdf')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Subir 2 documentos' }));

		await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});
});
