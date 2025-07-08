export interface MeditationListItem {
  id: string;
  transcript: string;
  audio_url: string;
  created_at: string;
}

export type BackgroundOption = {
  label: string;
  value: string;
  src: string;
}; 