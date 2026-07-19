'use client';
import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import useFuseSettings from '@fuse/core/FuseSettings/hooks/useFuseSettings';
import i18n from './i18n';
import I18nContext from './I18nContext';
import { LanguageType } from './I18nContext';

type I18nProviderProps = {
	children: React.ReactNode;
};

const languages: LanguageType[] = [
	{ id: 'es', title: 'Español', flag: 'ES' },
	{ id: 'fr', title: 'Français', flag: 'FR' }
];

// Persiste le choix de langue entre rechargements — sans ça, I18nProvider repartait
// systématiquement de i18n.options.lng ('es') à chaque chargement de page.
const STORAGE_KEY = 'lexassist-language';

function langueInitiale(): string {
	const stockee = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
	return stockee && languages.some((l) => l.id === stockee) ? stockee : (i18n.options.lng as string);
}

export function I18nProvider(props: I18nProviderProps) {
	const { children } = props;
	const { data: settings, setSettings } = useFuseSettings();
	const settingsThemeDirection = useMemo(() => settings.direction, [settings]);
	const [languageId, setLanguageId] = useState(langueInitiale);

	const changeLanguage = async (languageId: string) => {
		setLanguageId(languageId);
		window.localStorage.setItem(STORAGE_KEY, languageId);
		await i18n.changeLanguage(languageId);
	};

	useEffect(() => {
		if (languageId !== i18n.options.lng) {
			i18n.changeLanguage(languageId);
		}

		const langDirection = i18n.dir(languageId);

		if (settingsThemeDirection !== langDirection) {
			setSettings({ direction: langDirection });
		}
	}, [languageId, setSettings, settingsThemeDirection]);

	return (
		<I18nContext
			value={useMemo(
				() => ({
					language: _.find(languages, { id: languageId }),
					languageId,
					langDirection: i18n.dir(languageId),
					languages,
					changeLanguage
				}),
				[languageId]
			)}
		>
			{children}
		</I18nContext>
	);
}
