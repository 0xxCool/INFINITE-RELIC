import axios from 'axios';
import { get } from 'svelte/store';
import { telegramInitData } from './telegram';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
	baseURL: API_BASE,
	headers: {
		'Content-Type': 'application/json'
	}
});

// Add Telegram auth to all requests
api.interceptors.request.use((config) => {
	const initData = get(telegramInitData);
	if (initData) {
		config.headers['X-Telegram-Init-Data'] = initData;
	}
	return config;
});

export interface Quest {
	id: number;
	type: string;
	description: string;
	reward: number;
	status: 'AVAILABLE' | 'COMPLETED' | 'CLAIMED';
	cooldownEnd: string;
}

export interface UserStats {
	totalEarned: number;
	referralCount: number;
	questsCompleted: number;
	referralCode: string;
}

export async function getUserStats(): Promise<UserStats> {
	const { data } = await api.get('/user/stats');
	return data;
}

export async function getQuests(): Promise<Quest[]> {
	const { data } = await api.get('/quests');
	return data;
}

export async function claimQuest(questId: number): Promise<{ success: boolean; reward: number }> {
	const { data } = await api.post(`/quests/${questId}/claim`);
	return data;
}

export async function getReferralLink(): Promise<string> {
	const { data } = await api.get('/user/referral-link');
	return data.link;
}

export default api;
