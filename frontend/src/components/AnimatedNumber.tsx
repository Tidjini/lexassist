import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

type AnimatedNumberProps = {
	value: number;
	format?: (n: number) => string;
	className?: string;
};

// Compte de 0 (ou de l'ancienne valeur) jusqu'à `value` à chaque changement —
// réutilisé par les tuiles KPI et la carte Caisse du dashboard Accueil.
function AnimatedNumber(props: AnimatedNumberProps) {
	const { value, format = (n) => Math.round(n).toLocaleString('fr-FR'), className } = props;
	const spring = useSpring(0, { stiffness: 90, damping: 20, mass: 0.6 });
	const affichee = useTransform(spring, (v) => format(v));

	useEffect(() => {
		spring.set(value);
	}, [spring, value]);

	return (
		<motion.span className={className}>{affichee}</motion.span>
	);
}

export default AnimatedNumber;
