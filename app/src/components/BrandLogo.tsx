import { Image } from 'react-native';

/** PlaDa's grid/table mark. Transparent PNG, so it sits on any dark surface. */
export function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <Image
      accessibilityLabel="PlaDa"
      source={require('../../assets/logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
