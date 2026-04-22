/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { App } from 'antd';
import { addFavorite as addFavoriteService, getFavorites, removeFavorite as removeFavoriteService } from '@services/api';
import { useFavoritesStore } from '@/stores';
import { useAppTranslate } from '@/hooks';

export const useFavorites = () => {
	const { setFavorites, removeFavorite, setLoading, setError } = useFavoritesStore();
	const { message } = App.useApp();
	const { t } = useAppTranslate();

	const loadFavorites = async () => {
		setLoading(true);
		setError(null);
		try {
			const favorites = await getFavorites();
			setFavorites(favorites);
		} catch (error: any) {
			const errorMessage = error?.response?.data?.errorMessage || error?.message || 'Failed to load favorites';
			setError(errorMessage);
			console.error('Failed to load favorites:', error);
		} finally {
			setLoading(false);
		}
	};

	const addFavoriteHandler = async (pgmCd: string) => {
		try {
			await addFavoriteService(pgmCd);
			// Reload favorites to get the new one with full data
			await loadFavorites();
			message.success(t('Favorite added successfully'));
		} catch (error: any) {
			const errorMessage = error?.response?.data?.errorMessage || error?.message || t('Failed to add favorite');
			message.error(errorMessage);
			console.error('Failed to add favorite:', error);
		}
	};

	const removeFavoriteHandler = async (pgmCd: string) => {
		try {
			await removeFavoriteService(pgmCd);
			removeFavorite(pgmCd);
			message.success(t('Favorite removed successfully'));
		} catch (error: any) {
			const errorMessage = error?.response?.data?.errorMessage || error?.message || t('Failed to remove favorite');
			message.error(errorMessage);
			console.error('Failed to remove favorite:', error);
		}
	};

	useEffect(() => {
		loadFavorites();
	}, []);

	return {
		loadFavorites,
		addFavorite: addFavoriteHandler,
		removeFavorite: removeFavoriteHandler,
	};
};

