import { HomeReactionRow } from '@/features/home/HomeReactionRow';
const mockSetOpen = jest.fn();
jest.mock('react', () => ({ ...jest.requireActual('react'), useState: () => [false, mockSetOpen], useEffect: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/features/home/HomeEmojiPicker', () => ({ HomeEmojiPicker: 'Picker' }));
jest.mock('@/config/supabase', () => ({ supabase: {} }));
beforeEach(() => mockSetOpen.mockClear());
it('shows four quick reactions and opens the full picker from More', () => {
  const send = jest.fn(); const tree = HomeReactionRow({ disabled: false, targetId: 'friend', onReact: send });
  const [quick, more] = tree.props.children;
  expect(quick).toHaveLength(4);
  quick[0].props.onPress(); expect(send).toHaveBeenCalledWith('love');
  more.props.onPress(); expect(mockSetOpen).toHaveBeenCalledWith(true);
});
it('maps known emojis and sends exact custom choices while dismissing the picker', () => {
  const send = jest.fn(); const tree = HomeReactionRow({ disabled: false, targetId: 'friend', onReact: send });
  const picker = tree.props.children[2];
  picker.props.onSelect('🐱'); expect(send).toHaveBeenLastCalledWith('emoji:🐱');
  picker.props.onSelect('❤️'); expect(send).toHaveBeenLastCalledWith('love');
  expect(mockSetOpen).toHaveBeenCalledWith(false);
});
it('blocks quick and picker selection when dragging or exporting', () => {
  const send = jest.fn(); const tree = HomeReactionRow({ disabled: true, targetId: 'friend', onReact: send });
  const [quick, more, picker] = tree.props.children;
  quick[0].props.onPress(); more.props.onPress(); picker.props.onSelect('🐱');
  expect(send).not.toHaveBeenCalled(); expect(picker.props.visible).toBe(false);
});
