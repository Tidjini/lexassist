import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import ClienteFormDialog from '../ClienteFormDialog';

const apiMock = vi.hoisted(() => ({
	post: vi.fn(),
	get: vi.fn(),
	patch: vi.fn(),
	delete: vi.fn()
}));

vi.mock('@/utils/api', () => ({
	default: apiMock
}));

describe('ClienteFormDialog', () => {
	it('muestra los errores de validación y no llama a la API si faltan los campos obligatorios', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ClienteFormDialog
				open
				onClose={vi.fn()}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Crear' }));

		expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
		expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument();
		expect(apiMock.post).not.toHaveBeenCalled();
	});

	it('envía el formulario y crea el cliente cuando los campos son válidos', async () => {
		apiMock.post.mockReturnValue({
			json: () => Promise.resolve({ id: 1, nom: 'Garcia', prenom: 'Maria' })
		});
		const onClose = vi.fn();
		const user = userEvent.setup();
		renderWithProviders(
			<ClienteFormDialog
				open
				onClose={onClose}
			/>
		);

		await user.type(screen.getByLabelText('Nombre'), 'Maria');
		await user.type(screen.getByLabelText('Apellidos'), 'Garcia');
		await user.click(screen.getByRole('button', { name: 'Crear' }));

		await waitFor(() =>
			expect(apiMock.post).toHaveBeenCalledWith(
				'clientes/',
				expect.objectContaining({
					json: expect.objectContaining({ nom: 'Garcia', prenom: 'Maria' })
				})
			)
		);
		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});
});
