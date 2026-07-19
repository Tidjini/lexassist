import { useEffect, useRef, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import { ACCENTS } from '@/configs/designTokens';
import { useConversacionActual, useEnviarMensaje } from '../../api/hooks/useAsistente';
import type { Mensaje } from '../../api/types';

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
	const esUsuario = mensaje.rol === 'USUARIO';

	return (
		<div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
			<Paper
				className="max-w-[75%] rounded-2xl px-4 py-2.5"
				sx={{
					backgroundColor: esUsuario ? ACCENTS.asistente : 'background.paper',
					color: esUsuario ? '#fff' : 'text.primary',
					boxShadow: 'none',
					border: esUsuario ? 'none' : '1px solid var(--mui-palette-divider)'
				}}
			>
				<Typography
					variant="body2"
					className="whitespace-pre-wrap"
				>
					{mensaje.contenido}
				</Typography>
			</Paper>
		</div>
	);
}

function AsistenteView() {
	const { t } = useTranslation();
	const { data: conversacion, isLoading } = useConversacionActual();
	const enviarMutation = useEnviarMensaje();
	const [texto, setTexto] = useState('');
	const finRef = useRef<HTMLDivElement>(null);

	const mensajes = conversacion?.mensajes ?? [];
	const sinClave = enviarMutation.data?.error === 'SIN_CLAVE';

	useEffect(() => {
		finRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [mensajes.length, enviarMutation.isPending]);

	async function onEnviar() {
		const contenido = texto.trim();

		if (!contenido || enviarMutation.isPending) return;

		setTexto('');
		await enviarMutation.mutateAsync(contenido);
	}

	return (
		<FusePageSimple
			header={
				<div className="flex items-center gap-3 p-6">
					<div
						className="flex items-center justify-center rounded-2xl"
						style={{
							width: 48,
							height: 48,
							background: `linear-gradient(135deg, ${alpha(ACCENTS.asistente, 0.18)}, ${alpha(ACCENTS.asistente, 0.08)})`
						}}
					>
						<FuseSvgIcon
							size={24}
							style={{ color: ACCENTS.asistente }}
						>
							lucide:sparkles
						</FuseSvgIcon>
					</div>
					<div>
						<Typography
							variant="h4"
							className="font-bold"
						>
							{t('asistente.tituloPagina')}
						</Typography>
						<Typography color="text.secondary">{t('asistente.subtituloPagina')}</Typography>
					</div>
				</div>
			}
			content={
				<div className="flex h-full min-h-0 flex-col gap-4 p-6">
					<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
						{!isLoading && mensajes.length === 0 && (
							<EmptyState
								icone="lucide:sparkles"
								titre={t('asistente.emptyTitulo')}
								description={t('asistente.emptyDescripcion')}
								accent={ACCENTS.asistente}
							/>
						)}

						{mensajes.map((mensaje) => (
							<Burbuja
								key={mensaje.id}
								mensaje={mensaje}
							/>
						))}

						{enviarMutation.isPending && (
							<div className="flex justify-start">
								<Paper
									className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
									sx={{ boxShadow: 'none', border: '1px solid var(--mui-palette-divider)' }}
								>
									<CircularProgress size={14} />
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{t('asistente.pensando')}
									</Typography>
								</Paper>
							</div>
						)}

						{sinClave && (
							<div className="flex justify-start">
								<Paper
									className="max-w-[75%] rounded-2xl px-4 py-2.5"
									sx={{
										backgroundColor: alpha(ACCENTS.alertas, 0.12),
										boxShadow: 'none',
										border: `1px solid ${alpha(ACCENTS.alertas, 0.3)}`
									}}
								>
									<Typography variant="body2">{t('asistente.sinClave')}</Typography>
								</Paper>
							</div>
						)}

						<div ref={finRef} />
					</div>

					<div className="flex items-end gap-2">
						<TextField
							value={texto}
							onChange={(e) => setTexto(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									onEnviar();
								}
							}}
							placeholder={t('asistente.placeholder')}
							multiline
							maxRows={4}
							fullWidth
							size="small"
						/>
						<IconButton
							color="primary"
							aria-label={t('asistente.enviarBoton')}
							disabled={!texto.trim() || enviarMutation.isPending}
							onClick={onEnviar}
							sx={{
								backgroundColor: ACCENTS.asistente,
								color: '#fff',
								'&:hover': { backgroundColor: ACCENTS.asistente },
								'&.Mui-disabled': { backgroundColor: 'action.disabledBackground' }
							}}
						>
							<FuseSvgIcon size={20}>lucide:send</FuseSvgIcon>
						</IconButton>
					</div>
				</div>
			}
		/>
	);
}

export default AsistenteView;
