import { describe, expect, it } from 'vitest';
import { ESTADOS, estadoInfo } from '../index';

describe('estadoInfo', () => {
	it('devuelve la información del estado conocido', () => {
		expect(estadoInfo('DEPOSE')).toEqual({
			value: 'DEPOSE',
			labelKey: 'expedientes.estadoPresentado',
			color: 'info'
		});
	});

	it('cubre los 4 estados del backend (apps/dossiers/models.py Dossier.Statut)', () => {
		expect(ESTADOS.map((e) => e.value)).toEqual(['PREPARATION', 'DEPOSE', 'REQUERIMIENTO', 'RESOLU']);
	});
});
