import { Entry } from '@/entry/entities/entry.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { IJSONDataExtractor } from '@/common/csv/i-json-data-extractor';

export class EntryDataReadableExtractor implements IJSONDataExtractor<Entry> {
  extract(data: Partial<Entry>) {
    const amount =
      data.type === EntryTypes.Expense ? -(data.amount || 0) : data.amount || 0;
    const parsedAmount = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return {
      category: data.category?.name || 'Sem categoria',
      amount: parsedAmount,
      description: data.description || 'Sem descrição',
      when: new Date(data.when!).toLocaleString('pt-BR'),
    };
  }
}
