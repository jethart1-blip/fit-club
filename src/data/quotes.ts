export const MOTIVATIONAL_QUOTES: string[] = [
  "The only bad workout is the one that didn't happen.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Progress, not perfection.",
  "The pain of discipline is far less than the pain of regret.",
  "Success starts with self-discipline.",
  "Every workout is progress, no matter how small.",
  "You don't have to be extreme, just consistent.",
  "Push yourself, because no one else is going to do it for you.",
  "Small steps every day lead to big results.",
  "The body achieves what the mind believes.",
  "Today's effort is tomorrow's strength.",
  "Don't stop when you're tired. Stop when you're done.",
  "Make yourself a priority.",
  "Hard work beats talent when talent doesn't work hard.",
  "Sweat is just fat crying.",
  "One more rep. One more set. One more day.",
  "The only way to finish is to start.",
  "Champions train, losers complain.",
];

export function getQuoteOfTheDay(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
