import { useEffect } from 'react';
import { initUICollapsibles } from '../modules/uiCollapsibles';
import { initCustomSelects } from '../modules/customSelects';

export default function GlobalUiEnhancements() {
  useEffect(() => {
    initUICollapsibles();
    initCustomSelects();
  }, []);

  return null;
}
