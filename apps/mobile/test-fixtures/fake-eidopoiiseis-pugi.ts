import type { EidopoiiseisPugi, EidopoiisiGRAMMAT } from '@dps/adapters-capacitor';

/** Deterministic notification port used only by tests. */
export function dimiourgise_fake_eidopoiiseis_pugi(): EidopoiiseisPugi {
  let permission: 'prompt' | 'granted' = 'prompt';
  const pending = new Map<number, EidopoiisiGRAMMAT>();
  return {
    async checkPermissions() { return { display: permission }; },
    async requestPermissions() { permission = 'granted'; return { display: permission }; },
    async schedule({ notifications }) {
      for (const notification of notifications) pending.set(notification.id, notification);
      return { notifications: notifications.map(({ id }) => ({ id })) };
    },
    async cancel({ notifications }) { for (const { id } of notifications) pending.delete(id); },
    async cancelAll() { pending.clear(); },
    async getPending() { return { notifications: [...pending.values()] }; },
    async registerActionTypes() {},
  };
}
