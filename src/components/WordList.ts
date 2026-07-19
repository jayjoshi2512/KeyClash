export interface Passage {
  id: number;
  text: string;
  source: string;
  category: "philosophy" | "code" | "general" | "literature";
}

export const PASSAGES: Passage[] = [
  {
    id: 0,
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. As with all matters of the heart, you'll know when you find it.",
    source: "Steve Jobs",
    category: "general"
  },
  {
    id: 1,
    text: "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and by opposing end them.",
    source: "William Shakespeare",
    category: "literature"
  },
  {
    id: 2,
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    source: "Winston Churchill",
    category: "general"
  },
  {
    id: 3,
    text: "const quicksort = (arr: number[]): number[] => { if (arr.length <= 1) return arr; const pivot = arr[arr.length - 1]; const left = arr.filter((x, i) => x <= pivot && i < arr.length - 1); const right = arr.filter(x => x > pivot); return [...quicksort(left), pivot, ...quicksort(right)]; };",
    source: "TypeScript Quicksort",
    category: "code"
  },
  {
    id: 4,
    text: "In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.",
    source: "Douglas Adams, The Hitchhiker's Guide to the Galaxy",
    category: "literature"
  },
  {
    id: 5,
    text: "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena.",
    source: "Theodore Roosevelt",
    category: "philosophy"
  },
  {
    id: 6,
    text: "All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.",
    source: "J.R.R. Tolkien, The Fellowship of the Ring",
    category: "literature"
  },
  {
    id: 7,
    text: "Do not go gentle into that good night, old age should burn and rave at close of day; rage, rage against the dying of the light.",
    source: "Dylan Thomas",
    category: "literature"
  },
  {
    id: 8,
    text: "import { useState, useEffect } from 'react'; export function useDebounce<T>(value: T, delay: number): T { const [debounced, setDebounced] = useState<T>(value); useEffect(() => { const handler = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(handler); }, [value, delay]); return debounced; }",
    source: "React useDebounce Hook",
    category: "code"
  },
  {
    id: 9,
    text: "I have not failed. I've just found ten thousand ways that won't work. Many of life's failures are people who did not realize how close they were to success when they gave up.",
    source: "Thomas A. Edison",
    category: "general"
  },
  {
    id: 10,
    text: "He who fights with monsters should look to it that he himself does not become a monster. And if you gaze long into an abyss, the abyss also gazes into you.",
    source: "Friedrich Nietzsche",
    category: "philosophy"
  },
  {
    id: 11,
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit. The mind is everything; what you think you become.",
    source: "Aristotle",
    category: "philosophy"
  },
  {
    id: 12,
    text: "The matrix is everywhere. It is all around us. Even now, in this very room. You can see it when you look out your window or when you turn on your television. It is the world that has been pulled over your eyes to blind you from the truth.",
    source: "Morpheus, The Matrix",
    category: "general"
  },
  {
    id: 13,
    text: "A person who never made a mistake never tried anything new. Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world.",
    source: "Albert Einstein",
    category: "philosophy"
  },
  {
    id: 14,
    text: "async function fetchUserWithRetry(userId: string, retries = 3): Promise<User> { try { return await api.getUser(userId); } catch (err) { if (retries <= 0) throw err; await new Promise(resolve => setTimeout(resolve, 1000)); return fetchUserWithRetry(userId, retries - 1); } }",
    source: "JavaScript Async Retry",
    category: "code"
  },
  {
    id: 15,
    text: "The unexamined life is not worth living. There is only one good, knowledge, and one evil, ignorance. Wonder is the beginning of wisdom.",
    source: "Socrates",
    category: "philosophy"
  },
  {
    id: 16,
    text: "The mystery of life isn't a problem to solve, but a reality to experience. A process that cannot be understood by stopping it. We must move with the flow of the process.",
    source: "Frank Herbert, Dune",
    category: "literature"
  },
  {
    id: 17,
    text: "For the past thirty-three years, I have looked in the mirror every morning and asked myself: 'If today were the last day of my life, would I want to do what I am about to do today?' And whenever the answer has been 'No' for too many days in a row, I know I need to change something.",
    source: "Steve Jobs",
    category: "general"
  },
  {
    id: 18,
    text: "Walk as if you are kissing the Earth with your feet. Mindful breathing is the bridge that connects life to consciousness, which unites your body to your thoughts.",
    source: "Thich Nhat Hanh",
    category: "philosophy"
  },
  {
    id: 19,
    text: "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.",
    source: "Alan Turing",
    category: "general"
  }
];

export const getRandomPassage = (category?: string): Passage => {
  const filtered = category && category !== "all"
    ? PASSAGES.filter(p => p.category === category)
    : PASSAGES;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};
