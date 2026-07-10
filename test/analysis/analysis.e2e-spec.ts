import { $faker } from '@Test/helpers/$faker';
import { AnalysisHelper } from '@Test/helpers/analysis.helper';
import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Analysis (e2e)', () => {
  it('[List] - Deve ser capaz de listar as análises sem paginação', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get('/analyses?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data).toBeTruthy();
    expect(data.data.length).toBeGreaterThanOrEqual(2);

    for (const analysis of data.data) {
      expect(analysis.id).toBeTruthy();
      expect(analysis.openaiId).toBeTruthy();
      expect(analysis.userId).toBe(user.id);
      expect(analysis.inputTokens).toBeTruthy();
      expect(analysis.outputTokens).toBeTruthy();
      
      expect(analysis.output).toBeTruthy();
      expect(analysis.output.diagnostic).toBeTruthy();
      expect(typeof analysis.output.diagnostic).toBe('string');
      
      expect(Array.isArray(analysis.output.issues)).toBe(true);

      for (const issue of analysis.output.issues) {
        expect(issue.title).toBeTruthy();
        expect(typeof issue.title).toBe('string');
        expect(issue.effect).toBeTruthy();
        expect(typeof issue.effect).toBe('string');
      }

      expect(Array.isArray(analysis.output.actions)).toBe(true);

      for (const action of analysis.output.actions) {
        expect(action.title).toBeTruthy();
        expect(typeof action.title).toBe('string');
        expect(action.effect).toBeTruthy();
        expect(typeof action.effect).toBe('string');
      }

      expect(analysis.output.expectation).toBeTruthy();
      expect(typeof analysis.output.expectation).toBe('string');
    }
  });

  it('[List] - Deve ser capaz de listar as análises usando paginação', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const page = 1;
    const perPage = 10;

    const { body: data } = await api()
      .get(`/analyses?paginated=true&page=${page}&perPage=${perPage}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { body: dataWithoutPagination } = await api()
      .get('/analyses?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data).toBeTruthy();
    expect(data.meta).toBeTruthy();
    expect(data.meta.count).toBeGreaterThanOrEqual(dataWithoutPagination.data.length);
    expect(data.meta.page).toBe(page);
    expect(data.meta.perPage).toBe(perPage);
    expect(data.meta.pages).toBe(Math.ceil(dataWithoutPagination.meta.count / perPage));

    for (const analysis of data.data) {
      expect(analysis.id).toBeTruthy();
      expect(analysis.openaiId).toBeTruthy();
      expect(analysis.userId).toBe(user.id);
      expect(analysis.output).toBeTruthy();
      expect(analysis.output.diagnostic).toBeTruthy();
    }
  });

  it('[List] - Deve falhar ao tentar listar análises caso o usuário não esteja autenticado', async () => {
    await api().get('/analyses').expect(401);
  });

  it('[Show] - Deve ser capaz de encontrar uma análise', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const analysis = await AnalysisHelper.getOne(token);

    const { body: data } = await api()
      .get(`/analyses/${analysis.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.analysis.id).toBe(analysis.id);
    expect(data.analysis.userId).toBe(user.id);
    expect(data.analysis.openaiId).toBe(analysis.openaiId);
    
    expect(data.analysis.output).toBeTruthy();
    expect(data.analysis.output.diagnostic).toBeTruthy();
    expect(typeof data.analysis.output.diagnostic).toBe('string');
    
    expect(Array.isArray(data.analysis.output.issues)).toBe(true);

    for (const issue of data.analysis.output.issues) {
      expect(issue.title).toBeTruthy();
      expect(typeof issue.title).toBe('string');
      expect(issue.effect).toBeTruthy();
      expect(typeof issue.effect).toBe('string');
    }

    expect(Array.isArray(data.analysis.output.actions)).toBe(true);

    for (const action of data.analysis.output.actions) {
      expect(action.title).toBeTruthy();
      expect(typeof action.title).toBe('string');
      expect(action.effect).toBeTruthy();
      expect(typeof action.effect).toBe('string');
    }
		
    expect(typeof data.analysis.output.expectation).toBe('string');
  });

  it('[Show] - Deve falhar ao tentar encontrar uma análise inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get(`/analyses/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(data.message).toBe('Análise não encontrada');
  });

  it('[Show] - Deve falhar ao tentar encontrar uma análise de outro usuário', async () => {
    const [userOne, userTwo] = await UserHelper.getManySubscribed();
    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    
    const userOneAnalysis = await AnalysisHelper.getOne(userOneToken);

    const { body: data } = await api()
      .get(`/analyses/${userOneAnalysis.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);

    expect(data.message).toBe('Análise não encontrada');
  });

  it('[Create] - Deve ser capaz de gerar uma análise via OpenAI e salvá-la no banco', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.analysis).toBeTruthy();
    expect(data.analysis.id).toBeTruthy();
    expect(data.analysis.userId).toBe(user.id);
    expect(data.analysis.openaiId).toBeTruthy();
    expect(data.analysis.inputTokens).toBeTruthy();
    expect(data.analysis.outputTokens).toBeTruthy();
    expect(data.analysis.output).toBeTruthy();
    expect(data.analysis.output.diagnostic).toBeTruthy();
    expect(typeof data.analysis.output.diagnostic).toBe('string');
    expect(Array.isArray(data.analysis.output.issues)).toBe(true);

    for (const issue of data.analysis.output.issues) {
      expect(issue.title).toBeTruthy();
      expect(typeof issue.title).toBe('string');
      expect(issue.effect).toBeTruthy();
      expect(typeof issue.effect).toBe('string');
    }

    expect(Array.isArray(data.analysis.output.actions)).toBe(true);

    for (const action of data.analysis.output.actions) {
      expect(action.title).toBeTruthy();
      expect(typeof action.title).toBe('string');
      expect(action.effect).toBeTruthy();
      expect(typeof action.effect).toBe('string');
    }

    expect(typeof data.analysis.output.expectation).toBe('string');
  });

  it('[Create] - Deve falhar ao tentar gerar uma análise caso o usuário não esteja autenticado', async () => {
    await api().post('/analyses').expect(401);
  });

  it('[Remove] - Deve ser capaz de remover uma análise', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const analysis = await AnalysisHelper.getOne(token);

    await api()
      .delete(`/analyses/${analysis.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await api()
      .get(`/analyses/${analysis.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover uma análise inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .delete(`/analyses/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(data.message).toBe('Análise não encontrada');
  });

  it('[Remove] - Deve falhar ao tentar remover uma análise caso ela pertença a outro usuário', async () => {
    const [userOne, userTwo] = await UserHelper.getManySubscribed();
    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const userOneAnalysis = await AnalysisHelper.getOne(userOneToken);

    const { body: data } = await api()
      .delete(`/analyses/${userOneAnalysis.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);

    expect(data.message).toBe('Análise não encontrada');
  });
});
