export interface Phrase {
  id: number;
  japanese: string;
  romaji: string;
  vietnamese: string;
  category: string;
}

// Định nghĩa mới cho hội thoại
export interface DialogueLine {
  role: "A" | "B" | "C"; // Người nói A hoặc B
  japanese: string;
  romaji: string;
  vietnamese: string;
}

export interface Conversation {
  id: number;
  title: string;
  category: string;
  lines: DialogueLine[];
}
