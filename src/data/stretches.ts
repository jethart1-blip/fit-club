export interface Stretch {
  id: string;
  name: string;
  description: string;
}

export const STRETCH_SEQUENCE: Stretch[] = [
  { id: 'standing_quad_stretch', name: 'Standing Quad Stretch', description: 'Pull one heel toward your glutes, keeping knees together. Switch sides halfway.' },
  { id: 'hamstring_stretch', name: 'Hamstring Stretch', description: 'Sit and reach toward your toes with legs extended, or do a standing forward fold.' },
  { id: 'chest_doorway_stretch', name: 'Chest Stretch', description: 'Place your arm against a wall or doorway and gently rotate away to open the chest.' },
  { id: 'shoulder_cross_body_stretch', name: 'Shoulder Stretch', description: 'Pull one arm across your chest with the other arm, holding gently. Switch sides halfway.' },
  { id: 'childs_pose', name: "Child's Pose", description: 'Kneel and reach your arms forward, sitting your hips back toward your heels.' },
  { id: 'hip_flexor_stretch', name: 'Hip Flexor Stretch', description: 'Kneel in a lunge position and gently push your hips forward. Switch sides halfway.' },
  { id: 'calf_wall_stretch', name: 'Calf Stretch', description: 'Place hands on a wall, step one foot back, and press the heel down. Switch sides halfway.' },
];
