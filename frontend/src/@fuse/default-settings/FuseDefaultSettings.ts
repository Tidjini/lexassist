'use client';
import { createTheme, ThemeOptions } from '@mui/material/styles';
import qs from 'qs';
import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import type {} from '@mui/material/themeCssVarsAugmentation';

/**
 * The defaultTheme object defines the default color palette for the application.
 */
const defaultTheme = {
	palette: {
		mode: 'light',
		text: {
			primary: 'rgb(17, 24, 39)',
			secondary: 'rgb(107, 114, 128)',
			disabled: 'rgb(149, 156, 169)'
		},
		common: {
			black: 'rgb(17, 24, 39)',
			white: 'rgb(255, 255, 255)'
		},
		primary: {
			light: '#bec1c5',
			main: '#252f3e',
			dark: '#0d121b',
			contrastDefaultColor: 'light'
		},
		secondary: {
			light: '#bdf2fa',
			main: '#22d3ee',
			dark: '#0cb7e2'
		},
		background: {
			paper: '#FFFFFF',
			default: '#f6f7f9'
		},
		error: {
			light: '#ffcdd2',
			main: '#f44336',
			dark: '#b71c1c'
		}
	}
};

/**
 * The defaultSettings object defines the default settings for the Fuse application.
 */
export const defaultSettings = {
	customScrollbars: true,
	direction: 'ltr',
	layout: {},
	theme: {
		main: defaultTheme,
		navbar: defaultTheme,
		toolbar: defaultTheme,
		footer: defaultTheme
	}
};

/**
 * The getParsedQuerySettings function parses the query string to retrieve the default settings for the Fuse application.
 * It returns a FuseSettingsConfigType object that can be used to configure the application.
 */
export function getParsedQuerySettings(): FuseSettingsConfigType | object {
	if (typeof window === 'undefined') {
		return null;
	}

	const parsedQueryString = qs.parse(window?.location?.search, { ignoreQueryPrefix: true });

	const { defaultSettings = {} } = parsedQueryString;

	if (typeof defaultSettings === 'string') {
		// Handle the case when defaultSettings is a string
		return JSON.parse(defaultSettings) as FuseSettingsConfigType;
	}

	return {};

	// Generating route params from settings
	/* const settings = qs.stringify({
        defaultSettings: JSON.stringify(defaultSettings, {strictNullHandling: true})
    });
    console.info(settings); */
}

/**
 * Generates style overrides for contained buttons based on color.
 * Style plat repris de l'app mobile PROF : pas de dégradé ni d'ombre,
 * assombrissement franc au survol.
 */
function generateContainedButtonStyles(color: string) {
	return {
		boxShadow: 'none',
		'&:hover, &:active, &.Mui-focusVisible': {
			boxShadow: 'none',
			background: `var(--mui-palette-${color}-dark)`
		}
	};
}

/**
 *
 * @param value rem equivalent
 * @returns rem equivalent
 */
export function spacing(value: number) {
	return `calc(var(--mui-spacing) * ${value / 0.5 / 16})`;
}

type DefaultThemeOptions = Parameters<typeof createTheme>[0];

/**
 * The defaultThemeOptions object defines the default options for the MUI theme.
 */
export const defaultThemeOptions: DefaultThemeOptions = {
	cssVariables: true,
	spacing: '0.5rem',
	typography: {
		fontFamily: ['Inter Variable', 'Geist', 'Roboto', '"Helvetica"', 'Arial', 'sans-serif'].join(','),
		fontWeightLight: 300,
		fontWeightRegular: 400,
		fontWeightMedium: 500,
		// Hiérarchie typographique reprise de l'app mobile PROF : titres très
		// gras et resserrés, boutons graissés sans letter-spacing.
		h4: { fontWeight: 800, letterSpacing: '-0.02em' },
		h5: { fontWeight: 800, letterSpacing: '-0.02em' },
		h6: { fontWeight: 700, letterSpacing: '-0.01em' },
		subtitle1: { fontWeight: 600 },
		subtitle2: { fontWeight: 600 },
		button: { fontWeight: 700, letterSpacing: 0 }
	},
	breakpoints: {
		values: {
			xs: 0, // Extra small devices
			sm: 600, // Small devices
			md: 960, // Medium devices
			lg: 1280, // Large devices
			xl: 1920 // Extra large devices
		}
	},
	// Ombres douces en couches reprises de l'app mobile PROF : une couche de
	// contact fine + une couche diffuse large. Élévation 1 = OMBRE_CARTE,
	// élévation 8 = OMBRE_FLOTTANTE (voir src/configs/designTokens.ts).
	shadows: [
		'none', // 0
		'0 1px 2px rgba(15,17,21,0.04), 0 4px 16px rgba(15,17,21,0.06)', // 1 (OMBRE_CARTE)
		'0 1px 2px rgba(15,17,21,0.05), 0 5px 17px rgba(15,17,21,0.06)', // 2
		'0 2px 3px rgba(15,17,21,0.05), 0 5px 18px rgba(15,17,21,0.07)', // 3
		'0 2px 4px rgba(15,17,21,0.06), 0 6px 18px rgba(15,17,21,0.07)', // 4
		'0 2px 5px rgba(15,17,21,0.06), 0 6px 20px rgba(15,17,21,0.08)', // 5
		'0 2px 6px rgba(15,17,21,0.07), 0 7px 20px rgba(15,17,21,0.08)', // 6
		'0 2px 7px rgba(15,17,21,0.08), 0 7px 22px rgba(15,17,21,0.09)', // 7
		'0 2px 8px rgba(15,17,21,0.10), 0 8px 24px rgba(15,17,21,0.14)', // 8 (OMBRE_FLOTTANTE)
		'0 3px 8px rgba(15,17,21,0.10), 0 9px 25px rgba(15,17,21,0.14)', // 9
		'0 3px 9px rgba(15,17,21,0.10), 0 10px 26px rgba(15,17,21,0.14)', // 10
		'0 3px 9px rgba(15,17,21,0.11), 0 11px 27px rgba(15,17,21,0.15)', // 11
		'0 4px 10px rgba(15,17,21,0.11), 0 12px 28px rgba(15,17,21,0.15)', // 12
		'0 4px 10px rgba(15,17,21,0.11), 0 13px 29px rgba(15,17,21,0.15)', // 13
		'0 4px 11px rgba(15,17,21,0.12), 0 14px 30px rgba(15,17,21,0.16)', // 14
		'0 5px 11px rgba(15,17,21,0.12), 0 15px 31px rgba(15,17,21,0.16)', // 15
		'0 5px 12px rgba(15,17,21,0.12), 0 16px 32px rgba(15,17,21,0.16)', // 16
		'0 5px 12px rgba(15,17,21,0.13), 0 17px 34px rgba(15,17,21,0.17)', // 17
		'0 6px 13px rgba(15,17,21,0.13), 0 18px 36px rgba(15,17,21,0.17)', // 18
		'0 6px 13px rgba(15,17,21,0.13), 0 19px 38px rgba(15,17,21,0.18)', // 19
		'0 6px 14px rgba(15,17,21,0.14), 0 20px 40px rgba(15,17,21,0.18)', // 20
		'0 7px 14px rgba(15,17,21,0.14), 0 21px 42px rgba(15,17,21,0.19)', // 21
		'0 7px 15px rgba(15,17,21,0.15), 0 22px 44px rgba(15,17,21,0.20)', // 22
		'0 8px 16px rgba(15,17,21,0.16), 0 24px 48px rgba(15,17,21,0.22)', // 23
		'0 25px 50px -12px rgba(15,17,21,0.25)' // 24 (modales)
	],
	shape: {
		// Radius de base repris de l'app mobile PROF (boutons/inputs à 12,
		// cartes et surfaces à 16 via les overrides ci-dessous).
		borderRadius: 12
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					WebkitFontSmoothing: 'antialiased',
					MozOsxFontSmoothing: 'grayscale'
				}
			}
		},
		MuiSvgIcon: {
			defaultProps: {},
			styleOverrides: {
				root: {},
				fontSizeSmall: {
					fontSize: spacing(12)
				},
				fontSizeMedium: {
					fontSize: spacing(16)
				},
				fontSizeLarge: {
					fontSize: spacing(24)
				}
			}
		},
		MuiAppBar: {
			defaultProps: {
				enableColorOnDark: true,
				elevation: 0
			}
		},
		MuiToolbar: {
			styleOverrides: {
				root: {
					minHeight: spacing(48),
					'@media (min-width: 600px)': {
						minHeight: spacing(48)
					}
				},
				regular: {
					minHeight: spacing(48),
					'@media (min-width: 600px)': {
						minHeight: spacing(48)
					}
				},
				dense: {
					minHeight: spacing(40),
					'@media (min-width: 600px)': {
						minHeight: spacing(40)
					}
				}
			}
		},
		MuiChip: {
			defaultProps: {
				size: 'small'
			},
			styleOverrides: {
				root: {
					borderRadius: spacing(8),
					padding: spacing(2),
					fontWeight: 600
				},
				label: {
					paddingTop: 0,
					paddingBottom: 0,
					paddingRight: spacing(8),
					paddingLeft: spacing(8)
				},
				sizeSmall: {
					height: spacing(22),
					minHeight: spacing(22)
				},
				sizeMedium: {
					height: spacing(26),
					minHeight: spacing(26)
				},
				deleteIcon: {
					fontSize: spacing(16)
				}
			}
		},
		MuiAutocomplete: {
			styleOverrides: {
				inputRoot: {
					paddingTop: spacing(3),
					paddingBottom: spacing(3),
					gap: spacing(3)
				},
				root: {
					'& .MuiOutlinedInput-root .MuiAutocomplete-input': {
						padding: `${spacing(4)} ${spacing(12)}` // 4px 12px
					},
					'& .MuiOutlinedInput-root': {
						paddingLeft: spacing(4)
					}
				},
				tag: {
					margin: 0
				},
				tagSizeSmall: {
					height: spacing(20),
					minHeight: spacing(20),
					maxHeight: spacing(20)
				},
				tagSizeMedium: {
					height: spacing(24),
					minHeight: spacing(24),
					maxHeight: spacing(24)
				}
			}
		},
		MuiButtonBase: {
			defaultProps: {
				disableRipple: true
			}
		},
		MuiIconButton: {
			defaultProps: {
				size: 'medium'
			},
			styleOverrides: {
				root: {
					borderRadius: spacing(10)
				},
				sizeMedium: {
					width: spacing(32),
					height: spacing(32),
					maxHeight: spacing(32)
				},
				sizeSmall: {
					width: spacing(28),
					height: spacing(28),
					maxHeight: spacing(28)
				},
				sizeLarge: {
					width: spacing(36),
					height: spacing(36),
					maxHeight: spacing(36)
				}
			}
		},
		MuiBadge: {
			styleOverrides: {
				root: {
					borderRadius: spacing(6),
					'& > .MuiAvatar-root': {
						fontWeight: 500 + '!important'
					}
				}
			}
		},
		MuiAvatar: {
			styleOverrides: {
				root: {
					width: spacing(36),
					height: spacing(36),
					fontSize: '0.8125rem' // 13px
				}
			}
		},
		MuiCircularProgress: {
			defaultProps: {
				size: spacing(24)
			}
		},
		MuiFab: {
			defaultProps: {},
			styleOverrides: {
				root: {
					boxShadow: 'none',
					textTransform: 'none',
					height: spacing(36)
				},
				sizeSmall: {
					height: spacing(28)
				},
				sizeMedium: {
					height: 32
				},
				circular: {
					'&.MuiFab-sizeSmall': {
						width: spacing(28),
						height: spacing(28),
						minHeight: spacing(28)
					},
					'&.MuiFab-sizeMedium': {
						width: spacing(32),
						height: spacing(32),
						minHeight: spacing(32)
					},
					'&.MuiFab-sizeLarge': {
						width: spacing(36),
						height: spacing(36),
						minHeight: spacing(36)
					}
				}
			}
		},
		MuiButton: {
			defaultProps: {
				size: 'medium',
				variant: 'text',
				color: 'primary'
			},
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 700,
					lineHeight: 1,
					transition:
						'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, padding 0.05s ease-out',
					'&.Mui-focusVisible': {
						outline: '1px solid var(--mui-palette-action-focus)',
						outlineOffset: '2px'
					}
				},
				// Size-specific padding adjustments for the active state using --mui-spacing
				sizeSmall: {
					minHeight: spacing(28), // 1.75rem 28px
					minWidth: spacing(28), // 1.75rem 28px
					padding: `${spacing(6)} ${spacing(12)}`, // 6px 12px
					'&:active': {
						paddingTop: `calc(${spacing(6)} + ${spacing(1)})`, // 0.0625rem = 1px, 0.75rem = 12px
						paddingBottom: `calc(${spacing(6)} - ${spacing(1)})` // 0.0625rem = 1px, 0.75rem = 12px
					}
				},
				sizeMedium: {
					minHeight: spacing(32), // 2rem 32px
					minWidth: spacing(32), // 2rem 32px
					padding: `${spacing(6)} ${spacing(12)}`, // 6px 12px
					'&:active': {
						paddingTop: `calc(${spacing(6)} + ${spacing(1)})`, // 0.0078125rem = 1px
						paddingBottom: `calc(${spacing(6)} - ${spacing(1)})` // 0.0078125rem = 1px
					}
				},
				sizeLarge: {
					minHeight: spacing(36), // 2.25rem 36px
					minWidth: spacing(36), // 2.25rem 36px
					padding: `${spacing(8)} ${spacing(16)}`, // 8px 16px
					'&:active': {
						paddingTop: `calc(${spacing(8)} + ${spacing(1)})`, // 0.0625rem = 1px, 1rem = 16px
						paddingBottom: `calc(${spacing(8)} - ${spacing(1)})` // 0.0625rem = 1px, 1rem = 16px
					}
				},
				containedPrimary: generateContainedButtonStyles('primary'),
				containedSecondary: generateContainedButtonStyles('secondary'),
				containedError: generateContainedButtonStyles('error'),
				containedInfo: generateContainedButtonStyles('info'),
				containedSuccess: generateContainedButtonStyles('success'),
				containedWarning: generateContainedButtonStyles('warning'),
				startIcon: {
					fontSize: spacing(16),
					'& > *:nth-of-type(1)': {
						fontSize: 'inherit'
					}
				},
				endIcon: {
					fontSize: spacing(16),
					'& > *:nth-of-type(1)': {
						fontSize: 'inherit'
					}
				}
			}
		},
		MuiButtonGroup: {
			defaultProps: {
				color: 'secondary'
			}
		},
		MuiTab: {
			styleOverrides: {
				root: {
					borderRadius: spacing(8),
					textTransform: 'none',
					minWidth: spacing(28),
					minHeight: spacing(28),
					padding: `${spacing(4)} ${spacing(12)}`, // 4px 12px
					zIndex: 1,
					'&.Mui-selected': {
						color: 'var(--mui-palette-text-primary)'
					}
				}
			}
		},
		MuiTabs: {
			styleOverrides: {
				root: {
					padding: spacing(4),
					backgroundColor: 'var(--mui-palette-FilledInput-bg)',
					borderRadius: spacing(10),
					minHeight: 'auto',
					width: 'fit-content'
				},
				indicator: {
					minHeight: '100%',
					bottom: 0,
					top: 0,
					backgroundColor: 'var(--mui-palette-background-paper)',
					zIndex: 0,
					borderRadius: spacing(8),
					boxShadow: 'none',
					border: '1px solid var(--mui-palette-divider)'
				}
			}
		},
		MuiBreadcrumbs: {
			defaultProps: {
				separator: '›'
			},
			styleOverrides: {
				separator: {
					marginRight: spacing(10),
					marginLeft: spacing(10)
				}
			}
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: spacing(16)
				}
			}
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: 'none'
				},
				rounded: {
					borderRadius: spacing(16)
				}
			}
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: spacing(16)
				}
			}
		},
		MuiPopover: {
			styleOverrides: {
				paper: {
					borderRadius: spacing(12)
				}
			}
		},
		MuiTextField: {
			defaultProps: {
				color: 'secondary',
				size: 'medium'
			}
		},
		MuiFormControl: {
			defaultProps: {
				color: 'secondary'
			},
			styleOverrides: {
				root: {
					'& > label + .MuiInputBase-root': {
						marginTop: 0
					},
					'& > .MuiFormHelperText-root': {
						marginLeft: 0
					},
					'& > .MuiOutlinedInput-root, & > .MuiFilledInput-root': {
						'& + .MuiFormHelperText-root ': {
							marginLeft: 0
						}
					}
				}
			}
		},
		MuiFormLabel: {
			styleOverrides: {
				root: {
					fontSize: '0.75rem', // 12px
					fontWeight: 500,
					lineHeight: 2
				}
			}
		},
		MuiInputLabel: {
			defaultProps: {
				color: 'secondary'
			},
			styleOverrides: {
				root: {
					transform: 'translate(0, calc(var(--mui-spacing) * 0.5)) scale(1)',
					'&.MuiInputLabel-shrink': {
						transform: 'translate(0, calc(var(--mui-spacing) / -0.8)) scale(0.8)'
					},
					'&.MuiInputLabel-outlined, &.MuiInputLabel-filled': {
						transform: 'translate(calc(var(--mui-spacing) * 1.5), calc(var(--mui-spacing) * 0.5)) scale(1)',
						'&.MuiInputLabel-shrink': {
							transform:
								'translate(calc(var(--mui-spacing) * 1.5), calc(var(--mui-spacing) / -0.8)) scale(0.8)'
						},
						'&.MuiInputLabel-sizeSmall': {
							transform:
								'translate(calc(var(--mui-spacing) * 1.5), calc(var(--mui-spacing) * 0.5)) scale(1)',
							'&.MuiInputLabel-shrink': {
								transform:
									'translate(calc(var(--mui-spacing) * 1.5), calc(var(--mui-spacing) / -0.8)) scale(0.8)'
							}
						}
					}
				}
			}
		},
		MuiSelect: {
			defaultProps: {
				color: 'secondary',
				size: 'small'
			},
			styleOverrides: {
				select: {
					minHeight: 0
				}
			}
		},
		MuiFormHelperText: {
			styleOverrides: {
				root: {
					fontSize: '0.75rem' // 12px
				}
			}
		},
		MuiInputAdornment: {
			styleOverrides: {
				root: {
					'&:not(.MuiInputAdornment-hiddenLabel)': {}
				},
				filled: {
					lineHeight: 1
				}
			}
		},
		MuiInputBase: {
			styleOverrides: {
				root: {
					'& > textarea': {
						padding: 0
					}
				}
			}
		},
		MuiOutlinedInput: {
			defaultProps: {
				color: 'secondary'
			},
			styleOverrides: {
				root: {
					height: 'auto!important',
					minHeight: spacing(32),
					'&.MuiInputBase-sizeSmall': {
						minHeight: spacing(28)
					}
				},
				sizeSmall: {
					minHeight: spacing(28)
				},
				input: {
					padding: `${spacing(6)} ${spacing(12)}` // 6px 12px
				},
				inputSizeSmall: {
					padding: `${spacing(4)} ${spacing(12)}` // 4px 12px
				},
				multiline: {
					padding: `${spacing(6)} ${spacing(12)}` // 6px 12px
				},
				adornedStart: {
					paddingLeft: `${spacing(8)}`
				},
				inputAdornedStart: {
					paddingLeft: `${spacing(8)}`
				},
				adornedEnd: {
					paddingRight: `${spacing(8)}`
				},
				inputAdornedEnd: {
					paddingRight: `${spacing(8)}`
				}
			}
		},
		MuiFilledInput: {
			styleOverrides: {
				input: {
					padding: `${spacing(4)} ${spacing(12)}` // 4px 12px
				},
				multiline: {
					padding: `${spacing(4)} ${spacing(12)}` // 4px 12px
				},
				adornedStart: {
					paddingLeft: `${spacing(8)}`
				},
				adornedEnd: {
					paddingRight: `${spacing(8)}`
				}
			}
		},
		MuiCheckbox: {
			defaultProps: {
				color: 'secondary'
			},
			styleOverrides: {
				root: {
					borderRadius: spacing(4)
				}
			}
		},
		MuiRadio: {
			defaultProps: {
				color: 'secondary'
			},
			styleOverrides: {
				root: {
					padding: spacing(8)
				}
			}
		},
		MuiSwitch: {
			defaultProps: {
				color: 'secondary',
				size: 'small'
			},
			styleOverrides: {
				root: {
					padding: 0,
					margin: 8
				},
				sizeSmall: {
					width: spacing(28),
					height: spacing(16),
					'& .MuiSwitch-thumb': {
						width: spacing(12),
						height: spacing(12)
					},
					'& .MuiSwitch-switchBase': {
						padding: spacing(2),
						'&.Mui-checked': {
							transform: 'translateX(12px)'
						}
					},
					'& .MuiSwitch-track': {
						borderRadius: spacing(8)
					}
				},
				sizeMedium: {
					width: spacing(36),
					height: spacing(20),
					'& .MuiSwitch-thumb': {
						width: spacing(16),
						height: spacing(16)
					},
					'& .MuiSwitch-switchBase': {
						padding: spacing(2),
						'&.Mui-checked': {
							transform: `translateX(${spacing(16)})`
						}
					},
					'& .MuiSwitch-track': {
						borderRadius: spacing(10)
					}
				}
			}
		},
		MuiSlider: {
			defaultProps: {
				color: 'secondary',
				size: 'small'
			},
			styleOverrides: {
				root: {
					height: spacing(6),
					borderRadius: spacing(3)
				},
				sizeSmall: {
					height: spacing(4),
					borderRadius: spacing(2)
				},
				thumb: {
					width: spacing(16),
					height: spacing(16)
				},
				thumbSizeSmall: {
					width: spacing(12),
					height: spacing(12)
				}
			}
		},
		MuiTypography: {
			variants: []
		},
		MuiAlert: {
			styleOverrides: {
				root: {
					padding: `${spacing(12)} ${spacing(16)}`, // 12px 16px
					borderRadius: spacing(12)
				},
				icon: {
					padding: `${spacing(2)} 0`, // 2px 0
					fontSize: spacing(16)
				},
				message: {
					padding: '0'
				},
				standardSuccess: {
					border: '1px solid var(--mui-palette-success-main)',
					color: 'var(--mui-palette-success-main)'
				},
				standardInfo: {
					border: '1px solid var(--mui-palette-info-main)',
					color: 'var(--mui-palette-info-main)'
				},
				standardWarning: {
					border: '1px solid var(--mui-palette-warning-main)',
					color: 'var(--mui-palette-warning-main)'
				},
				standardError: {
					border: '1px solid var(--mui-palette-error-main)',
					color: 'var(--mui-palette-error-main)'
				}
			}
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					fontSize: '0.75rem', // 12px
					padding: `${spacing(6)} ${spacing(10)}`, // 6px 10px
					borderRadius: spacing(8)
				}
			}
		},
		MuiMenu: {
			defaultProps: {
				disableScrollLock: true
			},
			styleOverrides: {
				paper: {
					padding: `0 ${spacing(4)}`, // 0px 4px
					borderRadius: spacing(10)
				},
				list: {
					gap: spacing(2),
					display: 'grid'
				}
			}
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					borderRadius: spacing(6),
					padding: `${spacing(6)} ${spacing(8)}`, // 6px 8px
					'& .MuiListItemIcon-root': {
						minWidth: spacing(24),
						'& svg': {
							fontSize: spacing(16)
						}
					}
				}
			}
		},
		MuiList: {
			styleOverrides: {
				root: {
					padding: `${spacing(4)} 0` // 4px 0
				}
			}
		},
		MuiListItem: {
			styleOverrides: {
				root: {}
			}
		},
		MuiListItemText: {
			styleOverrides: {
				root: {},
				inset: {
					paddingLeft: spacing(24)
				}
			}
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					padding: `${spacing(6)} ${spacing(8)}` // 6px 8px
				}
			}
		},
		MuiListItemAvatar: {
			styleOverrides: {
				root: {
					minWidth: spacing(44)
				}
			}
		},
		MuiListItemIcon: {
			styleOverrides: {
				root: {
					minWidth: spacing(24),
					'& svg': {
						fontSize: spacing(16)
					}
				}
			}
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					padding: spacing(8)
				},
				sizeSmall: {
					padding: spacing(4)
				}
			}
		},
		MuiAccordion: {
			defaultProps: {
				disableGutters: true
			},
			styleOverrides: {
				root: {
					border: '1px solid var(--mui-palette-divider)',
					minHeight: 0,
					'&:first-of-type': {
						borderBottom: 'none'
					},
					'&:before': {
						display: 'none'
					}
				}
			}
		},
		MuiStepper: {
			styleOverrides: {
				root: {
					'& .MuiStep-vertical .MuiStepContent-root, & .MuiStepConnector-vertical': {
						marginLeft: spacing(8)
					},
					'& .MuiStepConnector-horizontal': {
						top: spacing(8)
					}
				}
			}
		},
		MuiStepIcon: {
			styleOverrides: {
				text: {
					fontSize: '0.875rem' // 14px
				}
			}
		}
	}
};

/**
 * The mustHaveThemeOptions object defines the options that must be present in the MUI theme.
 */
export const mustHaveThemeOptions = {
	typography: {
		htmlFontSize: 16,
		fontSize: 13,
		body1: {
			fontSize: '0.8125rem'
		},
		body2: {
			fontSize: '0.8125rem'
		}
	}
};

/**
 * The defaultThemes object defines the default themes for the application.
 */
export const defaultThemes = {
	default: {
		palette: {
			mode: 'light'
		}
	},
	defaultDark: {
		palette: {
			mode: 'dark'
		}
	}
};

/**
 * The extendThemeWithMixins function extends the theme with mixins.
 */
export function extendThemeWithMixins(obj: ThemeOptions) {
	const theme = createTheme(obj);
	return {
		border: (width = 1) => ({
			borderWidth: width,
			borderStyle: 'solid',
			borderColor: theme.vars.palette.divider
		}),
		borderLeft: (width = 1) => ({
			borderLeftWidth: width,
			borderStyle: 'solid',
			borderColor: theme.vars.palette.divider
		}),
		borderRight: (width = 1) => ({
			borderRightWidth: width,
			borderStyle: 'solid',
			borderColor: theme.vars.palette.divider
		}),
		borderTop: (width = 1) => ({
			borderTopWidth: width,
			borderStyle: 'solid',
			borderColor: theme.vars.palette.divider
		}),
		borderBottom: (width = 1) => ({
			borderBottomWidth: width,
			borderStyle: 'solid',
			borderColor: theme.vars.palette.divider
		})
	};
}
