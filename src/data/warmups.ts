export interface WarmupMove {
  id: string;
  name: string;
  description: string;
}

export const WARMUP_SEQUENCE: WarmupMove[] = [
  { id: 'arm_circles', name: 'Arm Circles', description: 'Rotate your arms in large circles, forward then backward.' },
  { id: 'leg_swings', name: 'Leg Swings', description: 'Swing one leg forward and back, then side to side. Switch legs halfway.' },
  { id: 'bodyweight_squats', name: 'Bodyweight Squats', description: 'Slow, controlled squats to warm up the hips and knees.' },
  { id: 'cat_cow', name: 'Cat-Cow Stretch', description: 'On hands and knees, alternate arching and rounding your back.' },
  { id: 'hip_openers', name: 'Hip Openers', description: 'Step side to side with deep lunges to open the hips.' },
  { id: 'shoulder_pass_throughs', name: 'Shoulder Pass-Throughs', description: 'Hold a band or towel, pass it overhead and behind your back.' },
  { id: 'walking_lunges_warmup', name: 'Walking Lunges', description: 'Slow walking lunges to activate the legs and glutes.' },
  { id: 'jumping_jacks_warmup', name: 'Jumping Jacks', description: 'Light jumping jacks to raise your heart rate.' },
];
