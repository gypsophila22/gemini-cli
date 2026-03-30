import { type Content } from '@google/generative-ai';

export interface HistoryData {
  lastTimestamp: number;
  history: Content[];
}

export interface ExtendedMetadata {
  webSearchQueries?: string[];
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
    };
  }>;
  searchEntryPoint?: {
    renderedHtml?: string;
  };
  groundingSupports?: Array<{
    segment?: {
      text?: string;
    };
  }>;
}
