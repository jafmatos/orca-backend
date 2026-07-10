import { Entry } from '@/entry/entities/entry.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { IJSONDataExtractor } from '@/common/csv/i-json-data-extractor';

const tokenOptimized = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
};

export class EntryDataTokenOptimizedExtractor implements IJSONDataExtractor<Entry> {
  extract(data: Partial<Entry>) {
    const amountSign = data.type === EntryTypes.Expense ? '-' : '';

    return {
      category: tokenOptimized(data.category?.name || 'Sem categoria'),
      amount: amountSign + tokenOptimized((data.amount || 0).toFixed(2)),
      description: tokenOptimized(data.description || 'Sem descrição'),
      when: tokenOptimized(
        new Date(data.when!).toLocaleString('pt-BR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ),
    };
  }
}
