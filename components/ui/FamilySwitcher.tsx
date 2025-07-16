import { Colors } from '@/constants/Colors';
import { familyService } from '@/src/services/FamilyService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface FamilyOption {
    id: string;
    name: string;
}

export default function FamilySwitcher() {
    const { t } = useTranslation();
    const [families, setFamilies] = useState<FamilyOption[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchFamilies = async () => {
            setLoading(true);
            const list = await familyService.getUserFamilies();
            setFamilies(list);
            // Determine current family id
            const cid = await familyService.getCurrentFamilyId();
            setCurrentId(cid);
            setLoading(false);
        };
        fetchFamilies();
    }, []);

    // Listen to real-time changes in current family ID
    useEffect(() => {
        const unsubscribe = familyService.listenToCurrentFamilyId((familyId) => {
            setCurrentId(familyId);
        });
        return unsubscribe;
    }, []);

    // Listen to real-time changes in user families list
    useEffect(() => {
        const unsubscribe = familyService.listenToUserFamilies((families) => {
            setFamilies(families);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Listen to name changes for the current family (to reflect renames instantly)
        if (!currentId) return;
        const unsub = familyService.listenToFamily(currentId, (fam) => {
            if (!fam) return;
            setFamilies((prev) => prev.map((f) => (f.id === fam.id ? { ...f, name: fam.name } : f)));
        });
        return unsub;
    }, [currentId]);

    if (loading)
        return (
            <View style={styles.switcher}>
                <View style={[styles.avatar, { backgroundColor: '#E5E7EB' }]} />
                <View style={[styles.skeletonText, { width: 80, height: 16 }]} />
            </View>
        );

    if (families.length === 0) return (
        <View style={styles.noFamiliesContainer}>
            <Text style={styles.noFamiliesText}>{t('family_no_families')}</Text>
        </View>
    );

    const current = families.find(f => f.id === currentId) || families[0];

    const openModal = () => {
        if (families.length <= 1) return;
        setModalVisible(true);
    };

    const handleSelect = async (fid: string) => {
        setModalVisible(false);
        if (fid === currentId) return;
        await familyService.switchFamily(fid);
        setCurrentId(fid);
    };

    return (
        <>
            <Pressable style={styles.switcher} onPress={openModal}>
                <View style={[styles.avatar, { backgroundColor: Colors.secondaryColor + '1A' }]}>
                    <Text style={styles.avatarText}>{current.name[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{current.name}</Text>
                {families.length > 1 && <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.textSecondary} />}
            </Pressable>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.backdrop}>
                    <Pressable style={styles.backdropPress} onPress={() => setModalVisible(false)} />
                </View>
                <View style={styles.sheet}>
                    {/* Drag handle */}
                    <View style={styles.dragHandle} />

                    <Text style={styles.sheetTitle}>{t('family_switcher_choose_family')}</Text>
                    <Text style={styles.sheetSubtitle}>{t('family_switcher_switch_desc')}</Text>

                    <FlatList
                        data={families}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Pressable style={styles.option} onPress={() => handleSelect(item.id)}>
                                <View style={[styles.optionAvatar, { backgroundColor: Colors.secondaryColor + '1A' }]}>
                                    <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionName}>{item.name}</Text>
                                </View>
                                {item.id === currentId && (
                                    <View style={styles.checkContainer}>
                                        <MaterialIcons name="check" size={20} color={Colors.secondaryColor} />
                                    </View>
                                )}
                            </Pressable>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    switcher: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.backgroundWhite,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    avatarText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: Colors.secondaryColor,
    },
    name: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginRight: 4,
    },
    noFamiliesContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    noFamiliesText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdropPress: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        maxHeight: '50%',
        backgroundColor: Colors.backgroundWhite,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 12,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.borderColor,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    sheetSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    optionAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    checkContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: Colors.borderColor,
        marginHorizontal: 4,
    },
    // Skeleton styles
    skeletonText: {
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginRight: 4,
    },
}); 