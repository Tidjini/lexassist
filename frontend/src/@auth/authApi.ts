import { User } from '@auth/user';
import { PartialDeep } from 'type-fest';
import api from '@/utils/api';

type AuthResponse = {
	user: User;
	access_token: string;
	refresh_token: string;
};

/**
 * Sign in — POST /api/accounts/token/
 */
export async function authSignIn(credentials: { email: string; password: string }): Promise<AuthResponse> {
	return api
		.post('accounts/token/', {
			json: credentials
		})
		.json();
}

/**
 * Sign in with stored token — GET /api/accounts/me/
 */
export async function authSignInWithToken(accessToken: string): Promise<Response> {
	return api.get('accounts/me/', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}

/**
 * Refresh access token — POST /api/accounts/token/refresh/
 */
export async function authRefreshToken(refreshToken?: string): Promise<Response> {
	const stored = refreshToken ?? localStorage.getItem('jwt_refresh_token') ?? '';
	return api.post('accounts/token/refresh/', {
		json: { refresh_token: stored },
		retry: 0
	});
}

/**
 * Update current user — PUT /api/accounts/me/
 */
export function authUpdateDbUser(user: PartialDeep<User>): Promise<Response> {
	return api.put('accounts/me/', {
		json: user
	});
}

/**
 * Sign up — not available, contact your administrator
 */
export async function authSignUp(_data: {
	displayName: string;
	email: string;
	password: string;
}): Promise<AuthResponse> {
	throw new Error('Sign up not available — contact your administrator.');
}

// Stubs for unused Firebase/AWS providers
export async function authGetDbUser(_userId: string): Promise<User> {
	throw new Error('Not implemented');
}

export async function authGetDbUserByEmail(_email: string): Promise<User> {
	throw new Error('Not implemented');
}

export async function authCreateDbUser(_user: PartialDeep<User>): Promise<User> {
	throw new Error('Not implemented');
}
