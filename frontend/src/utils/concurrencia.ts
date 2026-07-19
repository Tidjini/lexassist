/** Exécute `tarea` sur chaque élément de `items`, au plus `limite` en parallèle. */
export async function ejecutarConConcurrencia<T>(items: T[], limite: number, tarea: (item: T) => Promise<void>) {
	let indice = 0;

	async function trabajador() {
		while (indice < items.length) {
			const miIndice = indice;
			indice += 1;
			await tarea(items[miIndice]);
		}
	}

	await Promise.all(Array.from({ length: Math.min(limite, items.length) }, trabajador));
}
