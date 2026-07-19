import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

function SignInPageTitle() {
	const { t } = useTranslation();

	return (
		<div className="w-full">
			<img
				className="w-12"
				src="/assets/images/logo/logo.svg"
				alt="logo"
			/>

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">
				{t('auth.iniciarSesionTitulo')}
			</Typography>
			<div className="mt-0.5 flex items-baseline font-medium">
				<Typography>{t('auth.iniciarSesionSubtitulo')}</Typography>
			</div>
		</div>
	);
}

export default SignInPageTitle;
