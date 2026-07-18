/**
 * The authRoles object defines the authorization roles for the Fuse application,
 * matching the backend's User.role values (superadmin/avocat/assistant,
 * lowercased by UserSerializer.to_representation).
 */
const authRoles = {
	/**
	 * Gestion du cabinet : AVOCAT est l'admin du cabinet.
	 */
	avocat: ['avocat'],

	/**
	 * Tout compte rattaché à un cabinet (avocat ou assistant).
	 */
	assistant: ['avocat', 'assistant'],

	/**
	 * Staff plateforme — n'a pas de cabinet (cabinet=None).
	 */
	superadmin: ['superadmin'],

	/**
	 * The onlyGuest role grants access to unauthenticated users.
	 */
	onlyGuest: []
};

export default authRoles;
