import type { MuscleGroupSlot } from '../../types';

// ?raw imports return the SVG markup string directly, bypassing Vite/Rolldown's
// asset URL pipeline which can yield undefined in Vite 8 (Rolldown-based).
import absSvg from './abs.svg?raw';
import backSvg from './back.svg?raw';
import bicepsSvg from './biceps.svg?raw';
import calvesSvg from './calves.svg?raw';
import chestSvg from './chest.svg?raw';
import forearmsSvg from './forearms.svg?raw';
import glutesSvg from './glutes.svg?raw';
import hamstringsSvg from './hamstrings.svg?raw';
import quadsSvg from './quads.svg?raw';
import shouldersSvg from './shoulders.svg?raw';
import tricepsSvg from './triceps.svg?raw';

export const MUSCLE_ILLUSTRATIONS: Record<MuscleGroupSlot, string> = {
  abs: absSvg,
  back: backSvg,
  biceps: bicepsSvg,
  calves: calvesSvg,
  chest: chestSvg,
  forearms: forearmsSvg,
  glutes: glutesSvg,
  hamstrings: hamstringsSvg,
  quads: quadsSvg,
  shoulders: shouldersSvg,
  triceps: tricepsSvg,
};
