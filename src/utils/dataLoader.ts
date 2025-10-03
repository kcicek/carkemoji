import atasozleri from '../assets/atasozleri.json';
import deyimler from '../assets/deyimler.json';
import type { ExpressionEntry, RoundData } from '../types';

const all: ExpressionEntry[] = [
  ...atasozleri.map(e => ({ ...e, type: e.type as 'Atasözü' })),
  ...deyimler.map(e => ({ ...e, type: e.type as 'Deyim' }))
];

export function randomEntry(excludeIndices: Set<number> = new Set()): { entry: RoundData; index: number } {
  if (excludeIndices.size >= all.length) {
    throw new Error('Yeterli farklı kayıt yok');
  }
  let idx: number;
  do { idx = Math.floor(Math.random() * all.length); } while (excludeIndices.has(idx));
  const entry = all[idx];
  return { entry: { ...entry, emojiParts: splitEmojis(entry.emoji) }, index: idx };
}

export function splitEmojis(sequence: string): string[] {
  // naive split by zero-width joiner aware regex fallback to Array.from
  // Many sequences may contain normal characters; spread is acceptable.
  return Array.from(sequence.match(/(?:\p{Emoji}(?:\u200D\p{Emoji})*)/gu) || Array.from(sequence));
}

export function buildRings(emojiParts: string[], ringCount: number): string[][] {
  /*
    ÖNEMLİ DÜZELTME:
    Önceden fonksiyon her bir hedef emoji parçası için ring oluşturuyordu (emojiParts.length kadar),
    fakat çağıran taraf (App.yeniTur) ringCount hesaplayıp indices uzunluğu ringCount olacak şekilde başlatıyordu.
    Eğer emojiParts.length > ringCount ise sonraki turlarda isSolved/rings[index] uyuşmazlıkları oluşup
    doğru hizalama yanlış değerlendirilmiş olabilir.

    Artık yalnızca ilk `ringCount` kadar parçayı (veya parça daha az ise hepsini) kullanıyoruz.
  */
  const selectedTargets = emojiParts.slice(0, ringCount);
  const pool = collectEmojiPool();
  const baseSize = 8 + Math.floor(Math.random()*3); // 8-10
  return selectedTargets.map((target, i) => {
    const scale = 1 + i * 0.22; // her halka ~%22 daha fazla
    const desired = Math.max(8, Math.min(24, Math.round(baseSize * scale)));
    const uniqueSet: Set<string> = new Set([target]);
    while (uniqueSet.size < Math.min(desired, pool.length)) {
      uniqueSet.add(pool[Math.floor(Math.random()*pool.length)]);
    }
    let arr: string[] = Array.from(uniqueSet);
    while (arr.length < desired) {
      arr.push(arr[Math.floor(Math.random()*arr.length)]);
    }
    for (let j = arr.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [arr[j], arr[k]] = [arr[k], arr[j]];
    }
    return arr;
  });
}

function collectEmojiPool(): string[] {
  const set = new Set<string>();
  for (const e of all) {
    for (const part of splitEmojis(e.emoji)) set.add(part);
  }
  return Array.from(set);
}

export function isSolved(current: number[], rings: string[][], target: string[]): boolean {
  return current.every((idx, i) => rings[i][idx] === target[i]);
}
