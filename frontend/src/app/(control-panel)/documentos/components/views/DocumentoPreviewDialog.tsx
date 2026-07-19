import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import type { Documento } from '../../api/types';

type DocumentoPreviewDialogProps = {
	documento: Documento | null;
	onClose: () => void;
};

function DocumentoPreviewDialog({ documento, onClose }: DocumentoPreviewDialogProps) {
	const { t } = useTranslation();

	if (!documento) return null;

	const esImagen = documento.content_type.startsWith('image/');

	return (
		<Dialog
			open={!!documento}
			onClose={onClose}
			fullWidth
			maxWidth="md"
		>
			<DialogTitle>{documento.nom_original}</DialogTitle>
			<DialogContent>
				{esImagen ? (
					<img
						src={documento.fichier}
						alt={documento.nom_original}
						className="max-h-[70vh] w-full object-contain"
					/>
				) : (
					<iframe
						src={documento.fichier}
						title={documento.nom_original}
						className="h-[70vh] w-full"
					/>
				)}
			</DialogContent>
			<DialogActions className="p-4">
				<Button
					component="a"
					href={documento.fichier}
					target="_blank"
					rel="noreferrer"
				>
					{t('documentos.preview.abrirPestana')}
				</Button>
				<Button onClick={onClose}>{t('documentos.preview.cerrar')}</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DocumentoPreviewDialog;
