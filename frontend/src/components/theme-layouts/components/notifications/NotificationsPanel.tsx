import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useMarcarLeida, useNotificaciones } from './useNotificaciones';
import { useNotificacionesSocket } from './useNotificacionesSocket';
import type { Notificacion } from './notificacionesApi';

function NotificationsPanel() {
	const { t, i18n } = useTranslation();
	const [menu, setMenu] = useState<null | HTMLElement>(null);
	const { data } = useNotificaciones();
	const marcarLeidaMutation = useMarcarLeida();
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
	}

	return (
		<>
			<IconButton onClick={abrir}>
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
							onClick={() => onClickNotificacion(notificacion)}
							className="flex flex-col items-start gap-0.5 whitespace-normal"
							sx={{ opacity: notificacion.leida ? 0.6 : 1 }}
						>
							<Typography variant="body2">{notificacion.mensaje}</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								{new Date(notificacion.created_at).toLocaleString(
									i18n.language === 'fr' ? 'fr-FR' : 'es-ES'
								)}
							</Typography>
						</MenuItem>
					))
				)}
			</Popover>
		</>
	);
}

export default NotificationsPanel;
