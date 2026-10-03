import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function HomeCameraControls({ disabled, activePreset, onZoom, onFlip, stackCount, onFinish }: {
  disabled: boolean; activePreset: number; onZoom: (preset: 0.5 | 1 | 2) => void;
  onFlip: () => void; stackCount: number; onFinish: () => void;
}) {
  const { t } = useTranslation();
  return <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}>
    {stackCount > 0 ? <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Text style={{ color: '#fff' }}>{t('camera.photoStack.count', { count: stackCount })}</Text>
      <Pressable disabled={disabled} accessibilityRole="button" onPress={onFinish} style={{ padding: 12 }}><Text style={{ color: '#fff' }}>{t('camera.photoStack.finish')}</Text></Pressable>
    </View> : null}
    <View style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.45 : 1 }}>
      <View style={{ flexDirection: 'row', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 4 }}>
        {([0.5, 1, 2] as const).map(preset => <Pressable key={preset} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${preset}x`} accessibilityState={{ selected: activePreset === preset, disabled }} onPress={() => onZoom(preset)} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: activePreset === preset ? '#FFCC00' : '#fff', fontWeight: '600' }}>{preset}x</Text>
        </Pressable>)}
      </View>
      <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={t('camera.switchCamera')} onPress={onFlip} style={{ position: 'absolute', right: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' }}><Ionicons name="camera-reverse-outline" size={24} color="#fff" /></Pressable>
    </View>
  </View>;
}
