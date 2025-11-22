import { Browse, Merchant } from "@/configuration/grid-views";
import { CardSorting } from "@/enums/CardSorting";

export type AccountSettings = {
    backgroundCardId: number | null;
    showBrowseMode: boolean;
    browseModeDefaultOrdering: CardSorting | undefined;
    showCollectionMode: boolean;
    showMerchantMode: boolean;
    merchantModeDefaultOrdering: CardSorting | undefined;
    darkMode: boolean;
    welcomeMessage: string;
};

export function defaultAccountSettings(): AccountSettings {
    return {
        backgroundCardId: null,
        showBrowseMode: true,
        browseModeDefaultOrdering: Browse.baseContext.sortingMethod,
        showCollectionMode: true,
        showMerchantMode: true,
        merchantModeDefaultOrdering: Merchant.baseContext.sortingMethod,
        darkMode: false,
        welcomeMessage: '',
    };
}

export function validateAccountSettings(settings: AccountSettings): AccountSettings {
    const defaultSettings = defaultAccountSettings();

    return {
        backgroundCardId: typeof settings?.backgroundCardId === 'number' ? settings.backgroundCardId : defaultSettings.backgroundCardId,
        showBrowseMode: typeof settings?.showBrowseMode === 'boolean' ? settings.showBrowseMode : defaultSettings.showBrowseMode,
        browseModeDefaultOrdering: Object.values(CardSorting).includes(settings?.browseModeDefaultOrdering || '') ? settings.browseModeDefaultOrdering : defaultSettings.browseModeDefaultOrdering,
        showCollectionMode: typeof settings?.showCollectionMode === 'boolean' ? settings.showCollectionMode : defaultSettings.showCollectionMode,
        showMerchantMode: typeof settings?.showMerchantMode === 'boolean' ? settings.showMerchantMode : defaultSettings.showMerchantMode,
        merchantModeDefaultOrdering: Object.values(CardSorting).includes(settings?.merchantModeDefaultOrdering || '') ? settings.merchantModeDefaultOrdering : defaultSettings.merchantModeDefaultOrdering,
        darkMode: typeof settings?.darkMode === 'boolean' ? settings.darkMode : defaultSettings.darkMode,
        welcomeMessage: typeof settings?.welcomeMessage === 'string' ? settings.welcomeMessage : defaultSettings.welcomeMessage,
    };
}
