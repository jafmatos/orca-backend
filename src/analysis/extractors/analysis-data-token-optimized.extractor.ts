import { Analysis } from '../entities/analysis.entity';
import { IJSONDataExtractor } from '@/common/csv/i-json-data-extractor';

const tokenOptimized = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
};

export type AnalysisCSVRow = {
  date: string;
  diagnostic: string;
  issues: string;
  actions: string;
  expectation: string;
};

export class AnalysisDataTokenOptimizedExtractor implements IJSONDataExtractor<
  Analysis,
  AnalysisCSVRow
> {
  extract(data: Partial<Analysis>) {
    return {
      date: tokenOptimized(
        new Date(data.createdAt!).toLocaleString('pt-BR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
        }),
      ),
      diagnostic: tokenOptimized(data.output?.diagnostic || ''),
      issues: tokenOptimized(
        data.output?.issues.map((i) => i.title).join(', ') || '',
      ),
      actions: tokenOptimized(
        data.output?.actions.map((a) => a.title).join(', ') || '',
      ),
      expectation: tokenOptimized(data.output?.expectation || ''),
    };
  }
}
