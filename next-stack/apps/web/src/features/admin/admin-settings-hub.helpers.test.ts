import { describe, expect, it } from 'vitest';
import { ADMIN_SETTINGS_SECTIONS, resolveConfigCardToneClass } from './admin-settings-hub.helpers';

describe('admin-settings-hub.helpers', () => {
  it('mantiene dos secciones y tarjetas cargadas', () => {
    expect(ADMIN_SETTINGS_SECTIONS).toHaveLength(2);
    expect(ADMIN_SETTINGS_SECTIONS[0].cards.length).toBeGreaterThan(0);
    expect(ADMIN_SETTINGS_SECTIONS[1].cards.length).toBeGreaterThan(0);
  });

  it('resuelve clases por tono', () => {
    expect(resolveConfigCardToneClass('info')).toContain('sky');
    expect(resolveConfigCardToneClass('accent')).toContain('indigo');
  });
});
