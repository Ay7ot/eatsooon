// Simple in-memory onboarding service
// Just tracks if onboarding has been completed in current session

class OnboardingService {
    private static _instance: OnboardingService;
    private _hasCompletedOnboarding: boolean = false;

    static get instance() {
        if (!this._instance) this._instance = new OnboardingService();
        return this._instance;
    }
    private constructor() { }

    // Check if user has completed onboarding in this session
    hasCompletedOnboarding(): boolean {
        return this._hasCompletedOnboarding;
    }

    // Mark onboarding as completed for this session
    completeOnboarding(): void {
        this._hasCompletedOnboarding = true;
        console.log('OnboardingService - Onboarding completed');
    }

    // Reset onboarding state (called when user signs out)
    resetOnboarding(): void {
        this._hasCompletedOnboarding = false;
        console.log('OnboardingService - Onboarding reset');
    }
}

export const onboardingService = OnboardingService.instance; 