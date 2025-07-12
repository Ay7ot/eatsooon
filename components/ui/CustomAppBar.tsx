import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

interface CustomAppBarProps {
    title: string;
    onSettingsPress?: () => void;
}

export default function CustomAppBar({ title, onSettingsPress }: CustomAppBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
            />
            <LinearGradient
                colors={['rgba(229, 231, 235, 0)', Colors.secondaryColor]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                locations={[0.5, 1.0]}
                style={[styles.container, { paddingTop: insets.top }]}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <Pressable
                        style={styles.settingsButton}
                        onPress={onSettingsPress}
                        android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
                    >
                        <MaterialIcons name="settings" size={24} color={Colors.secondaryColor} />
                    </Pressable>
                </View>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 0.8,
        borderBottomColor: Colors.borderColor,
    },
    content: {
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    title: {
        fontFamily: 'Nunito-SemiBold',
        fontWeight: '600',
        fontSize: 26,
        color: Colors.secondaryColor,
        height: 33, // 26 * 1.3 line height
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.backgroundWhite,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
}); 