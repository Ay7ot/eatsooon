# FCM Integration Task List

## Overview
This document outlines the step-by-step process to migrate from Expo's background task system to Firebase Cloud Messaging (FCM) for reliable push notifications.

## Current State
- ✅ Firebase App initialized
- ✅ Authentication setup
- ✅ Firestore database
- ❌ Firebase Cloud Messaging (FCM)
- ❌ Background notifications not working reliably
- ✅ Language support for notifications (recently fixed)

## Phase 1: Setup & Dependencies

### Install FCM Dependencies
- [ ] Install `@react-native-firebase/messaging`
- [ ] Update `expo-notifications` if needed
- [ ] Verify all dependencies are compatible

### Update Firebase Configuration
- [ ] Add FCM initialization to `firebase.ts`
- [ ] Configure FCM token management
- [ ] Set up Firebase Messaging instance

### Update app.json Configuration
- [ ] Add FCM plugin configuration
- [ ] Configure notification channels for Android
- [ ] Set up iOS notification capabilities
- [ ] Add required permissions

## Phase 2: Client-Side FCM Service

### Create FCM Service
- [ ] Create `src/services/FCMService.ts`
- [ ] Initialize Firebase Messaging
- [ ] Handle FCM token registration/refresh
- [ ] Manage notification permissions
- [ ] Handle incoming notifications
- [ ] Handle notification actions (tap, etc.)

### Update App Initialization
- [ ] Initialize FCM in `app/_layout.tsx`
- [ ] Set up notification handlers
- [ ] Register for FCM tokens
- [ ] Handle app state changes

## Phase 3: Database Schema Updates

### Update User Profile Schema
- [ ] Add FCM token field to user profiles
- [ ] Add notification preferences field
- [ ] Add notification settings (frequency, types, etc.)

### Create Notification Tracking Schema
- [ ] Track notification delivery status
- [ ] Store notification history
- [ ] Track user engagement with notifications

## Phase 4: Backend/Cloud Functions

### Set up Firebase Cloud Functions
- [ ] Create scheduled function for expiring items check
- [ ] Implement notification sending logic
- [ ] Handle user targeting and personalization
- [ ] Add notification analytics tracking

### Create Notification Templates
- [ ] Single item expiry notifications
- [ ] Multiple items summary notifications
- [ ] Recipe suggestions notifications
- [ ] Family activity notifications

## Phase 5: Migration from Expo Background Tasks

### Update Notification Scheduling Logic
- [ ] Remove expo-background-task dependency
- [ ] Update NotificationService to work with FCM
- [ ] Implement server-side notification scheduling

### Update Notification Handling
- [ ] Handle FCM notifications in foreground
- [ ] Handle FCM notifications in background
- [ ] Implement notification actions (deep linking)

## Phase 6: Testing & Optimization

### Test FCM Token Registration
- [ ] Verify token refresh on app updates
- [ ] Test token cleanup on logout
- [ ] Test token registration on app install

### Test Notification Delivery
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test notification actions
- [ ] Test notification dismissal

### Test Language Support in Notifications
- [ ] Verify Spanish notifications work
- [ ] Test notification content in both languages
- [ ] Test dynamic language switching

### Performance Optimization
- [ ] Optimize notification frequency
- [ ] Implement notification batching
- [ ] Add notification analytics
- [ ] Monitor battery impact

## Phase 7: User Experience & Settings

### Create Notification Settings UI
- [ ] Notification frequency preferences
- [ ] Notification type preferences
- [ ] Quiet hours settings
- [ ] Notification sound preferences

### Add Notification Onboarding
- [ ] Explain notification benefits
- [ ] Guide users through permission setup
- [ ] Show notification preview

### Implement Notification History
- [ ] Show recent notifications
- [ ] Allow users to mark as read/unread
- [ ] Implement notification search

## Phase 8: Deployment & Cleanup

### Deploy Cloud Functions
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor function performance

### Remove Old Background Task Code
- [ ] Remove expo-background-task dependencies
- [ ] Clean up unused notification code
- [ ] Update package.json

### Update Documentation
- [ ] Update README with FCM setup
- [ ] Document notification system architecture
- [ ] Create troubleshooting guide

## Phase 9: Monitoring & Analytics

### Set up Notification Analytics
- [ ] Track delivery rates
- [ ] Track open rates
- [ ] Track user engagement
- [ ] Track notification effectiveness

### Implement Error Monitoring
- [ ] Monitor FCM token failures
- [ ] Monitor notification sending failures
- [ ] Set up alerts for critical issues

## Priority Order

1. **Phase 1** - Foundation setup (Critical)
2. **Phase 2** - Basic FCM functionality (Critical)
3. **Phase 4** - Backend notification system (Critical)
4. **Phase 5** - Migration from expo-background-task (Critical)
5. **Phase 6** - Testing and validation (Critical)
6. **Phase 3** - Database updates (Can be done in parallel)
7. **Phase 7** - User experience improvements (Nice to have)
8. **Phase 8** - Deployment and cleanup (Critical)
9. **Phase 9** - Monitoring and analytics (Important)

## Success Criteria

- [ ] Notifications work reliably in background
- [ ] Notifications display in correct language
- [ ] FCM tokens are properly managed
- [ ] Cloud functions run on schedule
- [ ] No battery drain from FCM
- [ ] Users can customize notification preferences
- [ ] Analytics show good delivery rates

## Notes

- Keep expo-background-task as fallback during transition
- Test thoroughly on both iOS and Android
- Monitor Firebase usage and costs
- Consider implementing notification batching for efficiency
- Plan for gradual rollout to users

## Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/) 