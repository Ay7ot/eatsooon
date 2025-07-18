import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/services/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import SvgIcon from '../../components/ui/SvgIcon';
import { ActivityModel, activityColorValue, activityIconName, activityTimeAgo } from '../models/ActivityModel';
import { activityService } from '../services/ActivityService';

interface RecentActivityProps {
    limit?: number;
    style?: ViewStyle;
}

export default function RecentActivity({ limit = 3, style }: RecentActivityProps) {
    const [activities, setActivities] = useState<ActivityModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (!user) return;
        const unsub = activityService.onActivitiesSnapshot({
            limit,
            next: (acts) => {
                setActivities(acts);
                setIsLoading(false);
            },
        });
        return unsub;
    }, [limit, user]);

    if (!user) {
        return (
            <View style={style}>
                <Text style={styles.title}>{t('profile_recent_activity')}</Text>
                <Text style={styles.emptyText}>{t('recent_sign_in_required')}</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={style}>
                <Text style={styles.title}>{t('profile_recent_activity')}</Text>
                <ActivitySkeleton count={limit} />
            </View>
        );
    }

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={[Colors.secondaryColor + '1A', Colors.secondaryColor + '0D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconWrapper}>
                <MaterialIcons name="timeline" size={32} color={Colors.secondaryColor} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>{t('recent_no_activity_yet')}</Text>
            <Text style={styles.emptySubtitle}>{t('recent_empty_subtitle')}</Text>
        </View>
    );

    return (
        <View style={style}>
            <Text style={styles.title}>{t('profile_recent_activity')}</Text>
            {activities.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ActivityItem activity={item} />}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
            )}
        </View>
    );
}

function ActivitySkeleton({ count }: { count: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, idx) => (
                <View key={idx} style={styles.skeletonItem} />
            ))}
        </View>
    );
}

function ActivityItem({ activity }: { activity: ActivityModel }) {
    const { t } = useTranslation();
    const color = activityColorValue(activity.type);
    const [imageError, setImageError] = useState(false);

    const { title, subtitle } = localizeActivity(activity, t);
    return (
        <View style={styles.itemContainer}>
            <View style={[styles.iconContainer, { borderColor: color + '1A' }]}>
                {activity.imageUrl && !imageError ? (
                    <Image
                        source={{ uri: activity.imageUrl }}
                        style={styles.imageThumb}
                        resizeMode="cover"
                        onError={() => {
                            console.log('Failed to load activity image:', activity.imageUrl);
                            setImageError(true);
                        }}
                    />
                ) : (
                    <LinearGradient
                        colors={[color + '26', color + '0D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconGradient}
                    >
                        <SvgIcon name={activityIconName(activity.type)} size={24} color={color} />
                    </LinearGradient>
                )}
            </View>
            <View style={styles.content}>
                <Text style={styles.activityTitle}>{title}</Text>
                {subtitle ? (
                    <Text style={styles.activitySubtitle}>{subtitle}</Text>
                ) : null}
            </View>
            <View style={styles.rightColumn}>
                <View style={styles.timePill}>
                    <Text style={styles.timeText}>{activityTimeAgo(activity.timestamp)}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
            </View>
        </View>
    );
}

function localizeActivity(activity: ActivityModel, t: any) {
    const { title, subtitle, metadata } = activity;

    // The 'title' and 'subtitle' fields now hold the translation keys.
    // The dynamic values are in the metadata.
    const localizedTitle = t(title, { ...metadata, defaultValue: title });
    const localizedSubtitle = subtitle ? t(subtitle, { ...metadata, defaultValue: subtitle }) : '';

    return { title: localizedTitle, subtitle: localizedSubtitle };
}

const styles = StyleSheet.create({
    title: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
        borderWidth: 1,
    },
    iconGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    activityTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    activitySubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 4,
    },
    rightColumn: {
        alignItems: 'flex-end',
    },
    timePill: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    timeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 10,
        color: Colors.textTertiary,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 8,
    },
    imageThumb: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: 20,
    },
    emptyContainer: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        padding: 32,
        alignItems: 'center',
    },
    emptyIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    skeletonItem: {
        height: 80,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        marginBottom: 12,
    },
}); 