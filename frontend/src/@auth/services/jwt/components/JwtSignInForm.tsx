import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import useJwtAuth from '../useJwtAuth';

type FormType = {
	email: string;
	password: string;
	remember?: boolean;
};

const defaultValues: FormType = {
	email: '',
	password: '',
	remember: true
};

function JwtSignInForm() {
	const { signIn } = useJwtAuth();
	const { t } = useTranslation();

	const schema = useMemo(
		() =>
			z.object({
				email: z.string().email(t('auth.errorEmailInvalido')).nonempty(t('auth.errorEmailRequerido')),
				password: z.string().min(4, t('auth.errorPasswordCorta')).nonempty(t('auth.errorPasswordRequerida')),
				remember: z.boolean().optional()
			}),
		[t]
	);

	const { control, formState, handleSubmit, setError } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	function onSubmit(formData: FormType) {
		const { email, password } = formData;

		signIn({
			email,
			password
		}).catch((error) => {
			const errorData = error?.data as {
				type: 'email' | 'password' | 'remember' | `root.${string}` | 'root';
				message: string;
			}[];

			errorData?.forEach?.((err) => {
				setError(err.type, {
					type: 'manual',
					message: err.message
				});
			});
		});
	}

	return (
		<form
			name="loginForm"
			noValidate
			className="flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label={t('auth.campoEmail')}
						autoFocus
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label={t('auth.campoPassword')}
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<div className="flex items-center">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel
								label={t('auth.recordarme')}
								control={
									<Checkbox
										size="small"
										{...field}
									/>
								}
							/>
						</FormControl>
					)}
				/>
			</div>

			<Button
				variant="contained"
				color="secondary"
				className="mt-4 w-full"
				aria-label={t('auth.botonEntrar')}
				disabled={_.isEmpty(dirtyFields) || !isValid}
				type="submit"
				size="large"
			>
				{t('auth.botonEntrar')}
			</Button>
		</form>
	);
}

export default JwtSignInForm;
