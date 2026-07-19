import '@testing-library/jest-dom/vitest';
import '@i18n/i18n';

// jsdom n'implémente pas matchMedia — nécessaire dès qu'un test rend un composant qui
// consulte les breakpoints (ex. FusePageSimple via useThemeMediaQuery).
if (!window.matchMedia) {
	window.matchMedia = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	});
}
