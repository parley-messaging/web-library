// This file contains all the different push types a Device can have

export const FCMAndroid = 1;
export const APNS = 2;
export const FCMWeb = 3;
export const CustomWebhook = 4;
export const CustomWebhookOAuth = 5;
export const FCMUniversal = 6;

export const AllPushTypes = {
	FCMAndroid,
	APNS,
	FCMWeb,
	CustomWebhook,
	CustomWebhookOAuth,
	FCMUniversal,
};
