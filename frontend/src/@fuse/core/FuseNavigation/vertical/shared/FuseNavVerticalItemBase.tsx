import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import clsx from 'clsx';
import { useMemo, ReactNode, useState, useEffect } from 'react';
import { Button, Collapse, IconButton, SxProps, Typography, TypographyProps } from '@mui/material';
import { motion } from 'motion/react';
import { ACCENTS } from 'src/configs/designTokens';
import FuseNavBadge from '../../FuseNavBadge';
import FuseSvgIcon from '../../../FuseSvgIcon';
import { FuseNavItemType } from '../../types/FuseNavItemType';
import isUrlInChildren from '../../isUrlInChildren';
import usePathname from '@fuse/hooks/usePathname';
import Link from '@fuse/core/Link';

// Accent du module pour teinter l'item de navigation actif — mêmes repères
// visuels que l'app mobile (pilule de la BottomNav teintée par module).
const ACCENT_PAR_ID: Record<string, string> = {
	inicio: ACCENTS.inicio,
	clientes: ACCENTS.clientes,
	expedientes: ACCENTS.expedientes,
	documentos: ACCENTS.documentos
};

export type FuseNavVerticalBaseProps = {
	item: FuseNavItemType;
	nestedLevel?: number;
	onItemClick?: (item: FuseNavItemType) => void;
	className?: string;
	component?: React.ElementType;
	children?: ReactNode;
	showIcon?: boolean;
	primaryTitleProps?: TypographyProps;
	subtitleProps?: TypographyProps;
	sx?: SxProps;
	checkPermission?: boolean;
	dense?: boolean;
};

function needsToBeOpened(pathname: string, item: FuseNavItemType) {
	return pathname && isUrlInChildren(item, pathname);
}

/**
 * FuseNavVerticalItemBase is a shared base component for all vertical navigation items
 */
function FuseNavVerticalItemBase(props: FuseNavVerticalBaseProps) {
	const {
		item,
		nestedLevel = 0,
		onItemClick,
		className,
		component,
		showIcon = true,
		primaryTitleProps = {},
		subtitleProps = {},
		sx,
		checkPermission,
		dense = false
	} = props;

	const pathname = usePathname();

	const isGroup = useMemo(() => item.type === 'group', [item.type]);
	const isCollapsable = useMemo(() => item.type === 'collapse', [item.type]);

	const buttonComponent = useMemo(() => {
		if (component) {
			return component;
		}

		if (item.url) {
			if (item.url.startsWith('http') || item.url.startsWith('mailto') || item.url.startsWith('https')) {
				return Link;
			}

			return NavLinkAdapter;
		}

		return 'div';
	}, [component, item.url]);
	const [open, setOpen] = useState(() => needsToBeOpened(pathname, item));

	useEffect(() => {
		if (isCollapsable && item.url) {
			setOpen((prev) => prev || needsToBeOpened(pathname, item));
		}
	}, [pathname, item, isCollapsable]);

	const itemProps = useMemo(
		() => ({
			...(buttonComponent === NavLinkAdapter && {
				disabled: item.disabled,
				to: item.url || '',
				end: item.end,
				role: 'button',
				exact: item?.exact
			}),
			...(buttonComponent === Link && {
				disabled: item.disabled,
				to: item.url,
				role: 'button',
				target: item.target ? item.target : '_blank',
				exact: item?.exact
			})
		}),
		[item, buttonComponent]
	);

	function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation();

		if (isCollapsable) {
			setOpen((prev) => prev || !prev);
		}

		if (onItemClick) {
			onItemClick(item);
		}
	}

	if (checkPermission && !item?.hasPermission) {
		return null;
	}

	// Item de menu réellement actif (route courante) : pilule animée qui glisse
	// d'un item à l'autre (layoutId partagé), teintée par l'accent du module.
	const estNavigable = !isGroup && !isCollapsable && Boolean(item.url) && !item.url.startsWith('http');
	const actif = estNavigable && (pathname === item.url || pathname.startsWith(`${item.url}/`));
	const accent = ACCENT_PAR_ID[item.id] ?? '#1F232B';

	return (
		<>
			<Button
				component={buttonComponent}
				className={clsx(
					'mb-1 flex w-full items-center justify-start gap-2 rounded-md p-2',
					item.active && 'active',
					item.subtitle && 'items-start',
					className,
					isGroup && 'my-4',
					dense && 'p-1'
				)}
				sx={{
					...sx,
					position: 'relative',
					transition: 'color 0.2s',
					...(actif && { color: `${accent}!important` }),
					// La pilule motion gère le fond de l'item actif — on neutralise
					// le fond `.active` d'origine pour ne pas superposer deux fonds.
					'&.active': {
						backgroundColor: 'transparent!important'
					},
					'&:hover .fuse-list-item-icon': {
						transform: 'translateX(1px) scale(1.08)'
					}
				}}
				color="inherit"
				onClick={handleClick}
				aria-label={item.title}
				aria-expanded={open}
				{...itemProps}
			>
				{actif && (
					<motion.span
						layoutId="fuse-nav-pilule-active"
						transition={{ type: 'spring', stiffness: 380, damping: 32 }}
						style={{
							position: 'absolute',
							inset: 0,
							borderRadius: 10,
							background: `${accent}14`,
							boxShadow: `inset 3px 0 0 0 ${accent}`
						}}
					/>
				)}
				{!isGroup && showIcon && item.icon && (
					<FuseSvgIcon
						className={clsx('fuse-list-item-icon', 'shrink-0', item.iconClass)}
						sx={{
							position: 'relative',
							zIndex: 1,
							transition: 'transform 0.2s, color 0.2s',
							...(actif && { color: accent })
						}}
					>
						{item.icon}
					</FuseSvgIcon>
				)}
				<div
					className="flex min-w-0 flex-auto flex-col items-start gap-1"
					style={{ position: 'relative', zIndex: 1 }}
				>
					{item.title && (
						<Typography
							{...{
								...primaryTitleProps,
								className: clsx(
									'fuse-list-item-title',
									'leading-none truncate max-w-full',
									isGroup && 'font-medium',
									actif && 'font-bold',
									primaryTitleProps?.className
								),
								...(isGroup && {
									color: 'secondary'
								})
							}}
						>
							{item.title}
						</Typography>
					)}
					{item.subtitle && (
						<Typography
							{...{
								color: 'text.secondary',
								...subtitleProps,
								className: clsx(
									'fuse-list-item-subtitle',
									'text-sm leading-none truncate max-w-full',
									subtitleProps?.className
								)
							}}
						>
							{item.subtitle}
						</Typography>
					)}
				</div>
				{item.badge && (
					<span style={{ position: 'relative', zIndex: 1 }}>
						<FuseNavBadge badge={item.badge} />
					</span>
				)}

				{isCollapsable && (
					<IconButton
						disableRipple
						className="h-5 w-5 p-0 hover:bg-transparent focus:bg-transparent"
						onClick={(ev) => {
							ev.preventDefault();
							ev.stopPropagation();
							setOpen(!open);
						}}
					>
						<FuseSvgIcon
							size={13}
							className="arrow-icon"
							color="inherit"
						>
							{open ? 'lucide:chevron-down' : 'lucide:chevron-right'}
						</FuseSvgIcon>
					</IconButton>
				)}
			</Button>

			{isCollapsable && (
				<Collapse
					in={open}
					className="collapse-children"
					sx={{
						...(nestedLevel < 4 && {
							paddingLeft: '16px',
							'& > .MuiCollapse-wrapper': {
								borderLeft: '1px solid',
								borderColor: 'divider',
								'& > .MuiCollapse-wrapperInner': {
									paddingLeft: '8px'
								}
							}
						})
					}}
				>
					{item?.children?.map((_item) => (
						<FuseNavVerticalItemBase
							key={_item.id}
							item={_item}
							nestedLevel={isGroup ? nestedLevel : nestedLevel + 1}
							onItemClick={onItemClick}
							checkPermission={checkPermission}
						/>
					))}
				</Collapse>
			)}

			{isGroup &&
				item?.children?.map((_item) => (
					<FuseNavVerticalItemBase
						key={_item.id}
						item={_item}
						nestedLevel={isGroup ? nestedLevel : nestedLevel + 1}
						onItemClick={onItemClick}
						checkPermission={checkPermission}
					/>
				))}
		</>
	);
}

export default FuseNavVerticalItemBase;
