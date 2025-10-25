import { writable } from 'svelte/store';

export interface TelegramUser {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
}

export const telegramUser = writable<TelegramUser | null>(null);
export const telegramInitData = writable<string>('');

export function initTelegram() {
	if (typeof window === 'undefined') return;

	const tg = window.Telegram?.WebApp;
	if (!tg) {
		console.warn('Telegram WebApp not available');
		return;
	}

	// Set theme
	tg.setHeaderColor('#0F172A');
	tg.setBackgroundColor('#0F172A');

	// Get user data
	if (tg.initDataUnsafe?.user) {
		telegramUser.set(tg.initDataUnsafe.user as TelegramUser);
	}

	// Store init data for backend authentication
	if (tg.initData) {
		telegramInitData.set(tg.initData);
	}

	// Enable closing confirmation
	tg.enableClosingConfirmation();

	// Setup main button
	tg.MainButton.setParams({
		text: 'CONNECT WALLET',
		color: '#8B5CF6',
		text_color: '#FFFFFF'
	});

	return tg;
}

export function showMainButton(text: string, onClick: () => void) {
	const tg = window.Telegram?.WebApp;
	if (!tg) return;

	tg.MainButton.setText(text);
	tg.MainButton.show();
	tg.MainButton.onClick(onClick);
}

export function hideMainButton() {
	const tg = window.Telegram?.WebApp;
	if (!tg) return;

	tg.MainButton.hide();
}

export function showBackButton(onClick: () => void) {
	const tg = window.Telegram?.WebApp;
	if (!tg) return;

	tg.BackButton.show();
	tg.BackButton.onClick(onClick);
}

export function hideBackButton() {
	const tg = window.Telegram?.WebApp;
	if (!tg) return;

	tg.BackButton.hide();
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning') {
	const tg = window.Telegram?.WebApp;
	if (!tg) return;

	switch (type) {
		case 'light':
		case 'medium':
		case 'heavy':
			tg.HapticFeedback.impactOccurred(type);
			break;
		case 'error':
		case 'success':
		case 'warning':
			tg.HapticFeedback.notificationOccurred(type);
			break;
	}
}

export function openLink(url: string, tryInstantView = false) {
	const tg = window.Telegram?.WebApp;
	if (!tg) {
		window.open(url, '_blank');
		return;
	}

	tg.openLink(url, { try_instant_view: tryInstantView });
}

export function closeMiniApp() {
	const tg = window.Telegram?.WebApp;
	if (!tg) return;

	tg.close();
}
