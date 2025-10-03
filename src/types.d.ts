export type ExpressionType = 'Atasözü' | 'Deyim';

export interface ExpressionEntry {
  emoji: string; // sequence like "💧💧➡️🌊"
  text: string;  // full proverb / idiom
  hint: string;  // hint text
  type: ExpressionType;
}

export interface PlayerState {
  id: number;
  name: string;
  score: number;
}

export interface RoundData extends ExpressionEntry {
  emojiParts: string[]; // splitted emoji sequence
}
