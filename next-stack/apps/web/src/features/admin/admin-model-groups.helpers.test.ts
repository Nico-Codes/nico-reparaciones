import { describe, expect, it } from 'vitest';
import {
  buildModelGroupBrandOptions,
  buildModelGroupDeviceTypeOptions,
  buildModelGroupOptions,
  patchModelGroup,
} from './admin-model-groups.helpers';

describe('admin-model-groups.helpers', () => {
  it('builds select options with default placeholder', () => {
    expect(buildModelGroupDeviceTypeOptions([{ id: 'type-1', name: 'Celular', slug: 'celular', active: true }])).toEqual([
      { value: '', label: 'Elegí...' },
      { value: 'type-1', label: 'Celular' },
    ]);

    expect(buildModelGroupBrandOptions([{ id: 'brand-1', name: 'Samsung', slug: 'samsung', active: true }])).toEqual([
      { value: '', label: 'Elegí...' },
      { value: 'brand-1', label: 'Samsung' },
    ]);

    expect(buildModelGroupOptions([{ id: 'group-1', name: 'Serie A', slug: 'serie-a', active: true }])).toEqual([
      { value: '', label: '- sin grupo -' },
      { value: 'group-1', label: 'Serie A' },
    ]);
  });

  it('patches only the requested group', () => {
    expect(
      patchModelGroup(
        [
          { id: 'group-1', name: 'Serie A', slug: 'serie-a', active: true },
          { id: 'group-2', name: 'Serie S', slug: 'serie-s', active: false },
        ],
        'group-2',
        { name: 'Serie S+', active: true },
      ),
    ).toEqual([
      { id: 'group-1', name: 'Serie A', slug: 'serie-a', active: true },
      { id: 'group-2', name: 'Serie S+', slug: 'serie-s', active: true },
    ]);
  });
});
