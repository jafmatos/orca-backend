import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { ScheduleHelper } from '@Test/helpers/schedule.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Schedule Occurrences (e2e)', () => {
  it('[Create] - Deve ser capaz de registrar uma ocorrência (concluir um agendamento) em uma data específica', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const schedule = await ScheduleHelper.getOne(token);
    const targetDate = new Date(user.currentCycle.start);

    const { body: response } = await api()
      .post(`/schedules/${schedule.id}/occurrence`)
      .set('Authorization', `Bearer ${token}`)
      .send({ when: targetDate.toISOString() })
      .expect(201);

    expect(response.occurrence).toBeDefined();
    expect(response.occurrence.scheduleId).toBe(schedule.id);
    expect(response.occurrence.entryId).toBeDefined();

    const { body: updatedScheduleData } = await api()
      .get(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(updatedScheduleData.schedule.id).toBe(schedule.id);
    expect(updatedScheduleData.schedule.cycles).toBeDefined();

    const hasDoneCycle = updatedScheduleData.schedule.cycles.some(
      (c: any) => c.status === 'done',
    );
    expect(hasDoneCycle).toBe(true);
  });

  it('[Delete] - Deve ser capaz de desconcluir um agendamento excluindo a entry associada à ocorrência', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const schedule = await ScheduleHelper.getOne(token);
    const targetDate = new Date(user.currentCycle.start);

    const { body: createResponse } = await api()
      .post(`/schedules/${schedule.id}/occurrence`)
      .set('Authorization', `Bearer ${token}`)
      .send({ when: targetDate.toISOString() })
      .expect(201);

    const entryId = createResponse.occurrence.entryId;

    await api()
      .delete(`/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { body: updatedScheduleData } = await api()
      .get(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(updatedScheduleData.schedule.id).toBe(schedule.id);
    expect(updatedScheduleData.schedule.cycles).toBeDefined();

    const hasDoneCycle = updatedScheduleData.schedule.cycles.some(
      (c: any) => c.status === 'done',
    );
    expect(hasDoneCycle).toBe(false);
  });
});
