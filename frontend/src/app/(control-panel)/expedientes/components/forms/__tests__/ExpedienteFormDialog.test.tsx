import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import ExpedienteFormDialog from '../ExpedienteFormDialog';

const apiMock = vi.hoisted(() => ({
	post: vi.fn(),
	get: vi.fn(),
	patch: vi.fn(),
	delete: vi.fn()
}));

vi.mock('@/utils/api', () => ({
	default: apiMock
}));

describe('ExpedienteFormDialog', () => {
	it('exige un título antes de crear el expediente', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ExpedienteFormDialog
				open
				clienteFijo={{ id: 1, label: 'Maria Garcia' }}
				onClose={vi.fn()}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Crear' }));

		expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
		expect(apiMock.post).not.toHaveBeenCalled();
	});

	it('crea el expediente con el cliente fijado', async () => {
		apiMock.post.mockReturnValue({
			json: () => Promise.resolve({ id: 5, titre: 'Arraigo social', cliente: 1 })
		});
		const onCreated = vi.fn();
		const user = userEvent.setup();
		renderWithProviders(
			<ExpedienteFormDialog
				open
				clienteFijo={{ id: 1, label: 'Maria Garcia' }}
				onClose={vi.fn()}
				onCreated={onCreated}
			/>
		);

		await user.type(screen.getByLabelText('Título'), 'Arraigo social');
		await user.click(screen.getByRole('button', { name: 'Crear' }));

		await waitFor(() =>
			expect(apiMock.post).toHaveBeenCalledWith(
				'expedientes/',
				expect.objectContaining({ json: expect.objectContaining({ cliente: 1, titre: 'Arraigo social' }) })
			)
		);
		await waitFor(() => expect(onCreated).toHaveBeenCalled());
	});
});
