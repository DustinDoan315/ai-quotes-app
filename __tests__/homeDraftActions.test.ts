import { HomeDraftActions } from '@/features/home/HomeDraftActions';
jest.mock('react-native', () => ({ Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: (s: unknown) => s } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const props = { onRewrite: jest.fn(), onSave: jest.fn(), onShare: jest.fn(), disabled: false, canRewrite: true, canSave: true, canShare: true, hasSavedPhoto: false, loading: false, isSaving: false, isSharing: false };
function nodes(element: any): any[] { if (!element?.props) return []; return [element, ...[element.props.children].flat(Infinity).flatMap(nodes)]; }
it('renders three visible touch targets using concrete styles instead of style callbacks', () => {
  const buttons = nodes(HomeDraftActions(props)).filter(e => e.props.accessibilityRole === 'button');
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    expect(typeof button.props.style).not.toBe('function');
    const style = Object.assign({}, ...button.props.style.filter(Boolean));
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.backgroundColor).toBeTruthy();
  }
  buttons[1].props.onPress(); expect(props.onSave).toHaveBeenCalled();
});
it('locks actions while exporting and does not lose the saved state', () => {
  const buttons = nodes(HomeDraftActions({ ...props, disabled: true, hasSavedPhoto: true })).filter(e => e.props.accessibilityRole === 'button');
  expect(buttons.every(b => b.props.disabled)).toBe(true);
  expect(buttons[1].props.accessibilityLabel).toBe('home.ambient.saved');
});
it('replaces actions with an accessible generation status while busy', () => {
  const tree = nodes(HomeDraftActions({ ...props, loading: true }));
  expect(tree.filter(e => e.props.accessibilityRole === 'button')).toHaveLength(0);
  expect(tree.find(e => e.props.accessibilityLiveRegion === 'polite')?.props.children).toBe('home.generating.findingWords');
});
