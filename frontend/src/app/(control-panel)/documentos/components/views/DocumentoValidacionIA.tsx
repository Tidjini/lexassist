import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useAplicarACliente } from '../../api/hooks/useDocumentos';
import { categoriaLabelKey, estadoIaInfo, type CamposExtraidos, type Documento } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';

const ETIQUETAS_CAMPO: Record<keyof CamposExtraidos, string> = {
	nombre: 'documentos.ia.campoNombre',
	apellidos: 'documentos.ia.campoApellidos',
	numero_documento: 'documentos.ia.campoNumeroDocumento',
	fecha_nacimiento: 'documentos.ia.campoFechaNacimiento',
	nacionalidad: 'documentos.ia.campoNacionalidad'
};

function DocumentoValidacionIA({ documento }: { documento: Documento }) {
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
	const aplicarMutation = useAplicarACliente();

	const info = estadoIaInfo(documento.estado_ia);
	const campos = Object.entries(documento.datos_extraidos || {}).filter(([, valeur]) => !!valeur) as [
		keyof CamposExtraidos,
		string
	][];

	function toggle(campo: string) {
		setSeleccionados((prev) => {
			const siguiente = new Set(prev);

			if (siguiente.has(campo)) siguiente.delete(campo);
			else siguiente.add(campo);

			return siguiente;
		});
	}

	async function aplicar(soloCategoria: boolean) {
		try {
			await aplicarMutation.mutateAsync({
				id: documento.id,
				payload: {
					campos: soloCategoria ? [] : Array.from(seleccionados),
					aplicar_categoria: soloCategoria
				}
			});
			enqueueSnackbar(t('documentos.ia.aplicado'), { variant: 'success' });

			if (!soloCategoria) setSeleccionados(new Set());
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	return (
		<Paper className="mt-4 flex flex-col gap-3 rounded-xl p-4">
			<div className="flex items-center gap-2">
				<Typography className="font-semibold">{t('documentos.ia.titulo')}</Typography>
				<Chip
					size="small"
					label={info && t(info.labelKey)}
					color={info?.color}
				/>
			</div>

			{documento.estado_ia === 'PROCESANDO' && (
				<div className="flex items-center gap-2">
					<CircularProgress size={16} />
					<Typography
						variant="body2"
						color="text.secondary"
					>
						{t(estadoIaInfo('PROCESANDO')!.labelKey)}
					</Typography>
				</div>
			)}

			{(documento.estado_ia === 'ERROR' || documento.estado_ia === 'SIN_CLAVE') && documento.error_ia && (
				<Typography
					variant="body2"
					color="text.secondary"
				>
					{t('documentos.ia.errorPrefijo', { motivo: documento.error_ia })}
				</Typography>
			)}

			{documento.estado_ia === 'COMPLETADO' && (
				<>
					{documento.categoria_sugerida && documento.categoria_sugerida !== documento.categorie && (
						<div className="flex items-center gap-2">
							<Typography variant="body2">
								{t('documentos.ia.categoriaSugerida', {
									categoria: t(categoriaLabelKey(documento.categoria_sugerida))
								})}
							</Typography>
							<Button
								size="small"
								onClick={() => aplicar(true)}
								disabled={aplicarMutation.isPending}
							>
								{t('documentos.ia.usarCategoria')}
							</Button>
						</div>
					)}

					{campos.length === 0 ? (
						<Typography
							variant="body2"
							color="text.disabled"
						>
							{t('documentos.ia.sinDatos')}
						</Typography>
					) : (
						<>
							<div className="flex flex-col">
								{campos.map(([campo, valeur]) => (
									<FormControlLabel
										key={campo}
										control={
											<Checkbox
												size="small"
												checked={seleccionados.has(campo)}
												onChange={() => toggle(campo)}
											/>
										}
										label={`${t(ETIQUETAS_CAMPO[campo])}: ${valeur}`}
									/>
								))}
							</div>
							<Button
								variant="contained"
								size="small"
								className="self-start"
								disabled={seleccionados.size === 0 || aplicarMutation.isPending}
								onClick={() => aplicar(false)}
							>
								{t('documentos.ia.aplicarBoton')}
							</Button>
						</>
					)}
				</>
			)}
		</Paper>
	);
}

export default DocumentoValidacionIA;
