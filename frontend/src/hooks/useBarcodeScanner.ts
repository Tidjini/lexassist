import { useEffect, useRef } from 'react';

// Écart maximal (ms) entre deux frappes pour qu'elles soient considérées comme
// provenant de la même rafale "douchette" — une vraie frappe humaine est presque
// toujours plus lente, une douchette USB (émulation clavier) tape en quelques ms.
const ECART_MAX_MS = 80;
const LONGUEUR_MIN = 3;

/**
 * Capture les rafales de frappes rapides d'un lecteur code-barres/QR USB (émulation
 * clavier) : accumule les caractères, réinitialise le buffer si l'écart dépasse
 * ECART_MAX_MS (distingue une vraie frappe humaine), déclenche onScan sur Entrée/Tab.
 * Écouteur en phase capture (voir ClasseEnDirectView) pour passer avant les
 * gestionnaires internes de MUI (Dialog/Autocomplete/Menu).
 */
export default function useBarcodeScanner(onScan: (valeur: string) => void, actif: boolean) {
	const bufferRef = useRef('');
	const dernierTempsRef = useRef(0);
	const onScanRef = useRef(onScan);

	useEffect(() => {
		onScanRef.current = onScan;
	}, [onScan]);

	useEffect(() => {
		if (!actif) {
			bufferRef.current = '';
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			const cible = event.target as HTMLElement | null;

			if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA' || cible.isContentEditable)) {
				return; // laisse la frappe humaine normale (ex. champ de recherche) intacte
			}

			const maintenant = performance.now();

			if (maintenant - dernierTempsRef.current > ECART_MAX_MS) {
				bufferRef.current = '';
			}

			dernierTempsRef.current = maintenant;

			if (event.key === 'Enter' || event.key === 'Tab') {
				const valeur = bufferRef.current;
				bufferRef.current = '';

				if (valeur.length >= LONGUEUR_MIN) {
					event.preventDefault();
					onScanRef.current(valeur);
				}

				return;
			}

			if (event.key.length === 1) {
				bufferRef.current += event.key;
			}
		}

		document.addEventListener('keydown', handleKeyDown, true);
		return () => document.removeEventListener('keydown', handleKeyDown, true);
	}, [actif]);
}
