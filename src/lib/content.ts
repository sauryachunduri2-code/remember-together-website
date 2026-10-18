// Typed access to the lesson and guide files synced from the app (npm run sync).
import lessonsFile from '../content/app/lessons.json';
import careFile from '../content/app/care.json';

export interface Source { name: string; title: string; url: string }

export interface LessonSection { heading: string; paragraphs?: string[]; bullets?: string[] }
export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  published: boolean;
  intro: string;
  sections: LessonSection[];
  keyPoints: string[];
  sources: Source[];
  lastChecked?: string;
}

export type GuideSectionStyle = 'text' | 'steps' | 'bullets' | 'avoid' | 'help';
export interface GuideSection { heading: string; style: GuideSectionStyle; items: string[] }
export interface Guide {
  id: string;
  group: string;
  title: string;
  summary: string;
  urgent?: { title: string; text: string };
  sections: GuideSection[];
  sources: Source[];
}

export const lessons: Lesson[] = (lessonsFile.lessons as Lesson[]).filter((lesson) => lesson.published);
export const guides: Guide[] = careFile.guides as Guide[];
export const careLastChecked: string = careFile.lastChecked;

export const guideGroups: { id: string; title: string; intro: string }[] = [
  { id: 'hard-moments', title: 'Hard moments', intro: 'What to do when a day gets difficult.' },
  { id: 'talking', title: 'Talking together', intro: 'Small changes that make conversations easier for both of you.' },
];
