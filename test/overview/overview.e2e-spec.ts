import { Category } from '@/category/entities/category.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { $faker } from '@Test/helpers/$faker';
import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { EntryHelper } from '@Test/helpers/entry.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Overview (e2e)', () => {
  it('[Status] - Deve retornar os KPIs de acordo com o ciclo atual do usuário', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: response } = await api()
      .get('/users/overview/kpis')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.status).toBeTruthy();

    const entries = await EntryHelper.getMany(token, {
      when: {
        ge: user.currentCycle.start,
        le: user.currentCycle.end,
      },
    });

    const expectedTotalExpense = entries
      .filter((e) => e.type === EntryTypes.Expense)
      .reduce((acc, e) => acc + e.amount, 0);

    const expectedTotalIncome = entries
      .filter((e) => e.type === EntryTypes.Income)
      .reduce((acc, e) => acc + e.amount, 0);

    const expectedBalance = expectedTotalIncome - expectedTotalExpense;

    expect(response.status.totalExpense).toBeCloseTo(expectedTotalExpense);
    expect(response.status.totalIncome).toBeCloseTo(expectedTotalIncome);
    expect(response.status.balance).toBeCloseTo(expectedBalance);
  });

  it('[Status] - Deve falhar ao tentar retornar os KPIs caso o usuário não esteja autenticado', async () => {
    await api().get('/users/overview/kpis').expect(401);
  });

  it('[Expense by Category] - Deve retornar os KPIs e as despesas por categoria de acordo com o ciclo atual do usuário', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: response } = await api()
      .get('/users/overview/expense-by-category')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.status).toBeTruthy();
    expect(response.categories).toBeTruthy();

    const entries = await EntryHelper.getMany(token, {
      when: {
        ge: user.currentCycle.start,
        le: user.currentCycle.end,
      },
    });

    const expectedTotalExpense = entries
      .filter((e) => e.type === EntryTypes.Expense)
      .reduce((acc, e) => acc + e.amount, 0);

    expect(response.status.totalExpense).toBeCloseTo(expectedTotalExpense);

    if (response.categories.length > 0) {
      const category = $faker.helpers.arrayElement<Category>(response.categories);
      const expectedSpent = entries
        .filter(
          (e) =>
            e.category?.id === category.id && e.type === EntryTypes.Expense,
        )
        .reduce((acc, e) => acc + e.amount, 0);

      expect(category.spent).toBeCloseTo(expectedSpent);
    }
  });

  it('[Expense by Category] - Deve retornar os KPIs e as despesas por categoria filtrando por um período de datas', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const entries = await EntryHelper.getMany(token);
    const middleIndex = Math.floor(entries.length / 2);
    const middleEntry = entries[middleIndex];
    const latestEntry = entries[0];
    const ge = new Date(middleEntry.when).toISOString();
    const le = new Date(latestEntry.when).toISOString();

    const { body: response } = await api()
      .get(
        `/users/overview/expense-by-category?filter=${encodeURIComponent(
          JSON.stringify({ when: { ge, le } }),
        )}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.status).toBeTruthy();
    expect(response.categories).toBeTruthy();

    const filteredEntries = entries.filter((e) => {
      const whenAsTime = new Date(e.when).getTime();
      const geAsTime = new Date(ge).getTime();
      const leAsTime = new Date(le).getTime();

      return whenAsTime >= geAsTime && whenAsTime <= leAsTime;
    });

    const expectedTotalExpense = filteredEntries
      .filter((e) => e.type === EntryTypes.Expense)
      .reduce((acc, e) => acc + e.amount, 0);

    expect(response.status.totalExpense).toBeCloseTo(expectedTotalExpense);
  });

  it('[Monthly Evolution] - Deve retornar as despesas totais, receitas totais e resultado de cada mês dos últimos 12 meses', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get('/users/overview/monthly-evolution?months=12')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.history).toBeTruthy();
    expect(data.history.length).toBe(12);

    for (const monthItem of data.history) {
      expect(monthItem.month).toBeTruthy();
      expect(typeof monthItem.balance).toBe('number');
      expect(typeof monthItem.totalExpense).toBe('number');
      expect(typeof monthItem.totalIncome).toBe('number');
    }
  });

  it('[Monthly Evolution] - Deve retornar as despesas totais, receitas totais e resultado de cada mês de uma quantidade definida de meses', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const months = $faker.number.int({ min: 2, max: 12 });

    const { body: data } = await api()
      .get(`/users/overview/monthly-evolution?months=${months}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.history).toBeTruthy();
    expect(data.history.length).toBe(months);
  });

  it('[Monthly Evolution] - Deve retornar a história contínua de todos os meses desde o primeiro lançamento quando months não é especificado', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const entries = await EntryHelper.getMany(token);
    const oldestEntry = entries[entries.length - 1];

    const oldestDate = new Date(oldestEntry.when);
    const currentDate = new Date();
    const oldestMonthStr = `${String(oldestDate.getMonth() + 1).padStart(2, '0')}/${String(oldestDate.getFullYear()).slice(-2)}`;
    const currentMonthStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getFullYear()).slice(-2)}`;

    const { body: data } = await api()
      .get('/users/overview/monthly-evolution')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.history).toBeTruthy();
    expect(data.history.length).toBeGreaterThan(0);

    expect(data.history[0].month).toBe(oldestMonthStr);
    expect(data.history[data.history.length - 1].month).toBe(currentMonthStr);

    for (const month of data.history) {
      const entriesOfMonth = entries.filter((entry) => {
        const entryDate = new Date(entry.when);
        const [monthNumber, yearShort] = month.month.split('/').map(Number);
        const year = 2000 + yearShort;

        return (
          entryDate.getUTCFullYear() === year &&
          entryDate.getUTCMonth() === monthNumber - 1
        );
      });
      const expectedTotalExpense = entriesOfMonth
        .filter((e) => e.type === EntryTypes.Expense)
        .reduce((acc, e) => acc + e.amount, 0);
      const expectedTotalIncome = entriesOfMonth
        .filter((e) => e.type === EntryTypes.Income)
        .reduce((acc, e) => acc + e.amount, 0);
      const expectedBalance = expectedTotalIncome - expectedTotalExpense;

      expect(month.totalExpense).toBeCloseTo(expectedTotalExpense);
      expect(month.totalIncome).toBeCloseTo(expectedTotalIncome);
      expect(month.balance).toBeCloseTo(expectedBalance);
    }
  });
});
