import { describe, expect, it } from 'vitest';
import { ESTADOS_IA, estadoIaInfo } from '../index';

describe('estadoIaInfo', () => {
	it('devuelve la información del estado IA conocido', () => {
		expect(estadoIaInfo('SIN_CLAVE')).toEqual({
			value: 'SIN_CLAVE',
			labelKey: 'documentos.ia.estadoSinClave',
			color: 'warning'
		});
	});

	it('cubre los 5 estados del backend (apps/documents/models.py Document.EstadoIA)', () => {
		expect(ESTADOS_IA.map((e) => e.value)).toEqual(['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'SIN_CLAVE']);
	});
});
