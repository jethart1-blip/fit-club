import type { MuscleGroupSlot } from '../../types';

import absSvg from './abs.svg';
import backSvg from './back.svg';
import bicepsSvg from './biceps.svg';
import calvesSvg from './calves.svg';
import chestSvg from './chest.svg';
import forearmsSvg from './forearms.svg';
import glutesSvg from './glutes.svg';
import hamstringsSvg from './hamstrings.svg';
import quadsSvg from './quads.svg';
import shouldersSvg from './shoulders.svg';
import tricepsSvg from './triceps.svg';

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
