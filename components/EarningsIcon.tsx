import React from 'react';
import { View, StyleSheet } from 'react-native';

interface EarningsIconProps {
  size?: number;
  color?: string;
}

export default function EarningsIcon({ size = 24, color = "#FFFFFF" }: EarningsIconProps) {
  const scale = size / 24; // Base scale for 24px
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Graduation Cap */}
      <View style={[styles.graduationCap, { 
        width: 16 * scale, 
        height: 8 * scale,
        backgroundColor: color === "#FFFFFF" ? "#4A4A4A" : color 
      }]}>
        {/* Cap base */}
        <View style={[styles.capBase, { 
          width: 14 * scale, 
          height: 2 * scale,
          backgroundColor: color === "#FFFFFF" ? "#4A4A4A" : color 
        }]} />
        {/* Tassel */}
        <View style={[styles.tassel, { 
          width: 2 * scale, 
          height: 6 * scale,
          backgroundColor: color === "#FFFFFF" ? "#FF8C00" : color 
        }]} />
      </View>
      
      {/* Clock */}
      <View style={[styles.clock, { 
        width: 12 * scale, 
        height: 12 * scale,
        backgroundColor: color === "#FFFFFF" ? "#FF8C00" : color 
      }]}>
        {/* Clock hands */}
        <View style={[styles.hourHand, { 
          width: 1 * scale, 
          height: 4 * scale,
          backgroundColor: color === "#FFFFFF" ? "#FF8C00" : color 
        }]} />
        <View style={[styles.minuteHand, { 
          width: 1 * scale, 
          height: 5 * scale,
          backgroundColor: color === "#FFFFFF" ? "#FF8C00" : color 
        }]} />
        {/* Clock marks */}
        <View style={[styles.clockMark, { 
          width: 0.5 * scale, 
          height: 1 * scale,
          backgroundColor: color === "#FFFFFF" ? "#E67300" : color 
        }]} />
      </View>
      
      {/* Hand */}
      <View style={[styles.hand, { 
        width: 8 * scale, 
        height: 10 * scale,
        backgroundColor: color === "#FFFFFF" ? "#FF8C00" : color 
      }]}>
        {/* Fingers */}
        <View style={[styles.fingers, { 
          width: 6 * scale, 
          height: 4 * scale,
          backgroundColor: color === "#FFFFFF" ? "#FF8C00" : color 
        }]} />
        {/* Cuff */}
        <View style={[styles.cuff, { 
          width: 4 * scale, 
          height: 2 * scale,
          backgroundColor: color === "#FFFFFF" ? "#4A4A4A" : color 
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graduationCap: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    alignItems: 'center',
  },
  capBase: {
    borderRadius: 1,
    marginTop: 1,
  },
  tassel: {
    position: 'absolute',
    top: 1,
    right: 0,
    borderRadius: 1,
  },
  clock: {
    position: 'absolute',
    top: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourHand: {
    position: 'absolute',
    borderRadius: 0.5,
    transform: [{ rotate: '45deg' }],
  },
  minuteHand: {
    position: 'absolute',
    borderRadius: 0.5,
    transform: [{ rotate: '60deg' }],
  },
  clockMark: {
    position: 'absolute',
    top: 1,
    borderRadius: 0.25,
  },
  hand: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 4,
    alignItems: 'center',
  },
  fingers: {
    borderRadius: 2,
    marginTop: 1,
  },
  cuff: {
    borderRadius: 1,
    marginTop: 2,
  },
});
