import type { RologiPyli } from '@dps/core';

/** `RologiPyli` που δίνει την ώρα του συστήματος (ο CLI τρέχει τοπικά, D2). */
export class SystemaRologi implements RologiPyli {
  tora(): Date {
    return new Date();
  }
}
