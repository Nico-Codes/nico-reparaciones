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

  it('define un slot editable para cada icono de tarjeta', () => {
    const cards = ADMIN_SETTINGS_SECTIONS.flatMap((section) => section.cards);

    expect(cards).toHaveLength(12);
    expect(cards.every((card) => card.iconSlot.startsWith('icon_settings_hub_'))).toBe(true);
    expect(new Set(cards.map((card) => card.iconSlot)).size).toBe(cards.length);
  });
});
