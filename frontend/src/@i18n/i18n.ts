import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import fr from './locales/fr.json';

/**
 * resources is an object that contains all the translations for the different languages.
 * ES est la langue par défaut (interface cliente du cabinet), FR est ajouté pour la
 * relecture/le suivi du projet — les deux sont tenus à jour en parallèle.
 */
const resources = {
	es: {
		translation: es
	},
	fr: {
		translation: fr
	}
};

/**
 * i18n is initialized with the resources object and the language to use.
 */
i18n.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
		lng: 'es',
		fallbackLng: 'es',

		interpolation: {
			escapeValue: false // react already safes from xss
		}
	});

export default i18n;
