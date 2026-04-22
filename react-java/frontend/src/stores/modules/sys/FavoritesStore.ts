import type { Favorite } from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FavoritesStoreState {
	favorites: Favorite[];
	favoritePgmCds: Set<string>;
	loading: boolean;
	error: string | null;

	setFavorites: (favorites: Favorite[]) => void;
	addFavorite: (favorite: Favorite) => void;
	removeFavorite: (pgmCd: string) => void;
	isFavorite: (pgmCd: string) => boolean;
	clearFavorites: () => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
}

const INITIAL_STATE = {
	favorites: [],
	favoritePgmCds: new Set<string>(),
	loading: false,
	error: null,
};

export const useFavoritesStore = create(
	devtools<FavoritesStoreState>((set, get) => ({
		...INITIAL_STATE,
		setFavorites: (favorites) => {
			const favoritePgmCds = new Set(favorites.map((f) => f.pgmCd).filter((pgmCd): pgmCd is string => Boolean(pgmCd)));
			set({ favorites, favoritePgmCds });
		},
		addFavorite: (favorite) => {
			set((state) => {
				const newFavorites = [...state.favorites, favorite];
				const newFavoritePgmCds = new Set(state.favoritePgmCds);
				if (favorite.pgmCd) {
					newFavoritePgmCds.add(favorite.pgmCd);
				}
				return {
					favorites: newFavorites,
					favoritePgmCds: newFavoritePgmCds,
				};
			});
		},
		removeFavorite: (pgmCd) => {
			set((state) => {
				const newFavorites = state.favorites.filter((f) => f.pgmCd !== pgmCd);
				const newFavoritePgmCds = new Set(state.favoritePgmCds);
				newFavoritePgmCds.delete(pgmCd);
				return {
					favorites: newFavorites,
					favoritePgmCds: newFavoritePgmCds,
				};
			});
		},
		isFavorite: (pgmCd) => {
			return get().favoritePgmCds.has(pgmCd);
		},
		clearFavorites: () => {
			set(INITIAL_STATE);
		},
		setLoading: (loading) => {
			set({ loading });
		},
		setError: (error) => {
			set({ error });
		},
	})),
);

