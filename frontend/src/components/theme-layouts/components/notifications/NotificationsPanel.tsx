import { useState } from 'react';
import { useNavigate } from 'react-router';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useEliminarNotificacion, useMarcarLeida, useNotificaciones } from './useNotificaciones';
import { useNotificacionesSocket } from './useNotificacionesSocket';
import type { Notificacion } from './notificacionesApi';

function NotificationsPanel() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const [menu, setMenu] = useState<null | HTMLElement>(null);
	const { data } = useNotificaciones();
	const marcarLeidaMutation = useMarcarLeida();
	const eliminarMutation = useEliminarNotificacion();
	// Pousse en temps réel (Channels) en plus du polling de useNotificaciones (15s) —
	// le WebSocket invalide déjà la query notificaciones à réception, ce hook n'a donc
	// rien de plus à faire ici que de rester monté.
	useNotificacionesSocket();

	const notificaciones = data?.results ?? [];
	const noLeidas = notificaciones.filter((n) => !n.leida).length;

	function abrir(event: React.MouseEvent<HTMLElement>) {
		setMenu(event.currentTarget);
	}

	function cerrar() {
		setMenu(null);
	}

	function onClickNotificacion(notificacion: Notificacion) {
		if (!notificacion.leida) marcarLeidaMutation.mutate(notificacion.id);

		cerrar();

		// La quasi-totalité des notifications actuelles concernent un document
		// (traitement IA terminé/en erreur) — on renvoie vers sa fiche plutôt que de
		// laisser le clic sans effet utile.
		if (notificacion.documento) navigate(`/documentos?highlight=${notificacion.documento}`);
	}

	function onEliminar(event: React.MouseEvent, id: number) {
		event.stopPropagation();
		eliminarMutation.mutate(id);
	}

	return (
		<>
			<IconButton
				onClick={abrir}
				data-testid="notifications-bell"
			>
				<Badge
					badgeContent={noLeidas}
					color="error"
				>
					<FuseSvgIcon>lucide:bell</FuseSvgIcon>
				</Badge>
			</IconButton>
			<Popover
				open={Boolean(menu)}
				anchorEl={menu}
				onClose={cerrar}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				transformOrigin={{ vertical: 'top', horizontal: 'center' }}
				classes={{ paper: 'py-2 w-80' }}
			>
				<Typography className="px-4 py-2 font-semibold">{t('notificaciones.titulo')}</Typography>
				<Divider />
				{notificaciones.length === 0 ? (
					<Typography
						className="px-4 py-4"
						color="text.secondary"
						variant="body2"
					>
						{t('notificaciones.vacio')}
					</Typography>
				) : (
					notificaciones.map((notificacion) => (
						<MenuItem
							key={notificacion.id}
							data-testid="notification-item"
							onClick={() => onClickNotificacion(notificacion)}
							className="flex items-start justify-between gap-2 whitespace-normal"
							sx={{ opacity: notificacion.leida ? 0.6 : 1 }}
						>
							<div className="flex flex-1 flex-col gap-0.5">
								<Typography variant="body2">{notificacion.mensaje}</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									{new Date(notificacion.created_at).toLocaleString(
										i18n.language === 'fr' ? 'fr-FR' : 'es-ES'
									)}
								</Typography>
							</div>
							<IconButton
								size="small"
								className="-mt-1 -mr-1"
								onClick={(event) => onEliminar(event, notificacion.id)}
								aria-label={t('notificaciones.eliminar')}
							>
								<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
							</IconButton>
						</MenuItem>
					))
				)}
			</Popover>
		</>
	);
}

export default NotificationsPanel;
