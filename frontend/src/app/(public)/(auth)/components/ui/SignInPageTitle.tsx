import Typography from '@mui/material/Typography';

function SignInPageTitle() {
	return (
		<div className="w-full">
			<img
				className="w-12"
				src="/assets/images/logo/logo.svg"
				alt="logo"
			/>

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">
				Iniciar sesión
			</Typography>
			<div className="mt-0.5 flex items-baseline font-medium">
				<Typography>LexAssist — Gestión documental inteligente</Typography>
			</div>
		</div>
	);
}

export default SignInPageTitle;
