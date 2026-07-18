export function initiales(nomComplet: string) {
	return nomComplet
		.split(' ')
		.filter(Boolean)
		.map((p) => p[0]?.toUpperCase())
		.slice(0, 2)
		.join('');
}
