import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const InventoryScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Inventory Screen (Work in progress)</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
    },
});

export default InventoryScreen; 