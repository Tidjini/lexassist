import { useState } from 'react';
import { useNavigate } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { useTranslation } from 'react-i18next';
import { useSubirDocumento } from '../../api/hooks/useDocumentos';
import type { Documento } from '../../api/types';
import DocumentoPreviewDialog from './DocumentoPreviewDialog';

const CONCURRENCIA = 3;

type EstadoArchivo = 'pendiente' | 'subiendo' | 'asignado' | 'sin_clasificar' | 'error';

type ItemImportacion = {
	id: string;
	file: File;
	estado: EstadoArchivo;
	documento?: Documento;
	error?: string;
};

function nuevoId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function ejecutarConConcurrencia<T>(items: T[], limite: number, tarea: (item: T) => Promise<void>) {
	let indice = 0;

	async function trabajador() {
		while (indice < items.length) {
			const miIndice = indice;
			indice += 1;
			await tarea(items[miIndice]);
		}
	}

	await Promise.all(Array.from({ length: Math.min(limite, items.length) }, trabajador));
}

function ImportacionMasivaView() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [items, setItems] = useState<ItemImportacion[]>([]);
	const [enCurso, setEnCurso] = useState(false);
	const [terminado, setTerminado] = useState(false);
	const [previewDocumento, setPreviewDocumento] = useState<Documento | null>(null);
	const subirMutation = useSubirDocumento();

	function agregarArchivos(fichiers: FileList | null) {
		if (!fichiers) return;

		const nuevos: ItemImportacion[] = Array.from(fichiers).map((file) => ({
			id: nuevoId(),
			file,
			estado: 'pendiente'
		}));
		setItems((prev) => [...prev, ...nuevos]);
	}

	function quitarArchivo(id: string) {
		setItems((prev) => prev.filter((item) => item.id !== id));
	}

	function actualizarItem(id: string, cambios: Partial<ItemImportacion>) {
		setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
	}

	async function iniciarImportacion() {
		setEnCurso(true);
		setTerminado(false);

		await ejecutarConConcurrencia(items, CONCURRENCIA, async (item) => {
			actualizarItem(item.id, { estado: 'subiendo' });

			try {
				const documento = await subirMutation.mutateAsync({ fichier: item.file });
				actualizarItem(item.id, {
					estado: documento.cliente === null ? 'sin_clasificar' : 'asignado',
					documento
				});
			} catch {
				actualizarItem(item.id, { estado: 'error', error: t('documentos.importacion.errorSubida') });
			}
		});

		setEnCurso(false);
		setTerminado(true);
	}

	const total = items.length;
	const completados = items.filter((i) => i.estado !== 'pendiente' && i.estado !== 'subiendo').length;
	const asignados = items.filter((i) => i.estado === 'asignado').length;
	const sinClasificar = items.filter((i) => i.estado === 'sin_clasificar');
	const errores = items.filter((i) => i.estado === 'error').length;

	const chipPorEstado: Record<
		EstadoArchivo,
		{ labelKey: string; color: 'default' | 'info' | 'success' | 'warning' | 'error' }
	> = {
		pendiente: { labelKey: 'documentos.importacion.estadoPendiente', color: 'default' },
		subiendo: { labelKey: 'documentos.importacion.estadoSubiendo', color: 'info' },
		asignado: { labelKey: 'documentos.importacion.estadoAsignado', color: 'success' },
		sin_clasificar: { labelKey: 'documentos.importacion.estadoSinClasificar', color: 'warning' },
		error: { labelKey: 'documentos.importacion.estadoError', color: 'error' }
	};

	return (
		<>
			<FusePageSimple
				header={
					<div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<IconButton
								onClick={() => navigate('/documentos')}
								className="mb-2 -ml-2"
							>
								<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
							</IconButton>
							<Typography
								variant="h4"
								className="font-bold"
							>
								{t('documentos.importacion.tituloPagina')}
							</Typography>
							<Typography color="text.secondary">
								{t('documentos.importacion.subtituloPagina')}
							</Typography>
						</div>
					</div>
				}
				content={
					<div className="flex flex-col gap-4 p-6">
						{!enCurso && !terminado && (
							<>
								<Button
									component="label"
									variant="outlined"
									startIcon={<FuseSvgIcon size={18}>lucide:upload</FuseSvgIcon>}
									className="self-start"
								>
									{t('documentos.importacion.seleccionarArchivos')}
									<input
										type="file"
										hidden
										multiple
										accept="image/jpeg,image/png,image/webp,application/pdf"
										onChange={(e) => agregarArchivos(e.target.files)}
									/>
								</Button>

								{items.length > 0 && (
									<Paper className="flex flex-col divide-y rounded-xl">
										{items.map((item) => (
											<div
												key={item.id}
												className="flex items-center justify-between gap-2 px-4 py-2"
											>
												<Typography
													variant="body2"
													className="truncate"
												>
													{item.file.name}
												</Typography>
												<IconButton
													size="small"
													onClick={() => quitarArchivo(item.id)}
												>
													<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
												</IconButton>
											</div>
										))}
									</Paper>
								)}

								<Button
									variant="contained"
									className="self-start"
									disabled={items.length === 0}
									onClick={iniciarImportacion}
								>
									{t('documentos.importacion.iniciarBoton', { cantidad: items.length })}
								</Button>
							</>
						)}

						{(enCurso || terminado) && (
							<>
								<div className="flex flex-col gap-2">
									<Typography variant="body2">
										{t('documentos.importacion.progreso', { completados, total })}
									</Typography>
									<LinearProgress
										variant="determinate"
										value={total === 0 ? 0 : (completados / total) * 100}
									/>
								</div>

								<Paper className="flex flex-col divide-y rounded-xl">
									{items.map((item) => (
										<div
											key={item.id}
											className="flex items-center justify-between gap-2 px-4 py-2"
										>
											<Typography
												variant="body2"
												className="truncate"
											>
												{item.file.name}
											</Typography>
											<Chip
												size="small"
												label={t(chipPorEstado[item.estado].labelKey)}
												color={chipPorEstado[item.estado].color}
											/>
										</div>
									))}
								</Paper>

								{terminado && (
									<Paper className="flex flex-col gap-3 rounded-xl p-4">
										<Typography className="font-semibold">
											{t('documentos.importacion.resumenTitulo')}
										</Typography>
										<Typography variant="body2">
											{t('documentos.importacion.resumenAsignados', { cantidad: asignados })}
										</Typography>
										<Typography variant="body2">
											{t('documentos.importacion.resumenSinClasificar', {
												cantidad: sinClasificar.length
											})}
										</Typography>
										{errores > 0 && (
											<Typography
												variant="body2"
												color="error"
											>
												{t('documentos.importacion.resumenErrores', { cantidad: errores })}
											</Typography>
										)}

										{sinClasificar.length > 0 && (
											<div className="flex flex-col gap-1">
												{sinClasificar.map(
													(item) =>
														item.documento && (
															<Button
																key={item.id}
																size="small"
																variant="outlined"
																className="self-start"
																onClick={() => setPreviewDocumento(item.documento!)}
															>
																{item.file.name}
															</Button>
														)
												)}
											</div>
										)}

										<Button
											variant="contained"
											className="self-start"
											onClick={() => navigate('/documentos')}
										>
											{t('documentos.importacion.verDocumentos')}
										</Button>
									</Paper>
								)}
							</>
						)}
					</div>
				}
			/>

			<DocumentoPreviewDialog
				documento={previewDocumento}
				onClose={() => setPreviewDocumento(null)}
			/>
		</>
	);
}

export default ImportacionMasivaView;
