export interface Finisher {
  id: string;
  name: string;
  description: string;
}

export const FINISHERS: Finisher[] = [
  { id: 'burpees', name: 'Burpees', description: 'Squat, kick back to a plank, push-up, jump up.' },
  { id: 'mountain_climbers', name: 'Mountain Climbers', description: 'Drive knees alternately toward your chest in a plank position.' },
  { id: 'jumping_jacks', name: 'Jumping Jacks', description: 'Jump while raising arms and spreading legs.' },
  { id: 'high_knees', name: 'High Knees', description: 'Run in place, driving knees up high.' },
  { id: 'plank', name: 'Plank Hold', description: 'Hold a straight-arm or forearm plank position.' },
  { id: 'jump_squats', name: 'Jump Squats', description: 'Squat down, then explode upward into a jump.' },
  { id: 'flutter_kicks', name: 'Flutter Kicks', description: 'Lying on your back, alternate small leg kicks.' },
  { id: 'shadow_boxing', name: 'Shadow Boxing', description: 'Throw fast punches in the air, staying light on your feet.' },
];
