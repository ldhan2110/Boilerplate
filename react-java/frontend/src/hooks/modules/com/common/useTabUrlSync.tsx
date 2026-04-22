import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import appStore from '@/stores/AppStore';
import { ROUTES } from '@/utils/routes';
import { reaction } from 'mobx';

/**
 * Hook to sync tabs with browser URL
 * - Updates browser URL when selected tab changes: /{selectedTabKey}
 * - Opens and selects tab when URL changes
 */
export function useTabUrlSync() {
	const navigate = useNavigate();
	const location = useLocation();
	const isInitialized = useRef(false);
	const isUpdatingFromUrl = useRef(false);
	const reactionDisposer = useRef<(() => void) | null>(null);

	// Handle URL changes (initial load and navigation)
	useEffect(() => {
		const pathname = location.pathname;

		// If path is just "/", initialize with default state
		if (pathname === '/' || pathname === '') {
			if (!isInitialized.current) {
				isInitialized.current = true;
			}
			return;
		}

		// Parse tabKey from URL (remove leading slash)
		const tabKey = pathname.slice(1).trim();

		if (tabKey.length === 0) {
			if (!isInitialized.current) {
				isInitialized.current = true;
			}
			return;
		}

		isUpdatingFromUrl.current = true;

		try {
			// Find route by the tab key (screen key)
			const route = ROUTES.find((r) => r.key === tabKey);

			if (route) {
				// Check if tab already exists
				const existingTab = appStore.state.openedTabs.find((tab) => tab.key === tabKey);

				if (!existingTab) {
					// Open new tab with the screen key from URL
					appStore.openTab({
						key: tabKey,
						label: route.label,
					});
				}

				// Select the tab specified in URL (use setTimeout to ensure tab is opened first)
				setTimeout(() => {
					const tabToSelect = appStore.state.openedTabs.find((tab) => tab.key === tabKey);
					if (tabToSelect && appStore.state.selectedTab.key !== tabKey) {
						appStore.setSelectedTab(tabKey);
					}
				}, 50);
			}
		} finally {
			// Use setTimeout to ensure state updates complete before allowing URL updates
			setTimeout(() => {
				isUpdatingFromUrl.current = false;
			}, 100);
		}

		if (!isInitialized.current) {
			isInitialized.current = true;
		}
	}, [location.pathname]);

	// Update URL when tabs change (but not when updating from URL)
	useEffect(() => {
		if (!isInitialized.current) {
			return;
		}

		// Dispose previous reaction if exists
		if (reactionDisposer.current) {
			reactionDisposer.current();
		}

		// Create reaction to watch tab changes
		reactionDisposer.current = reaction(
			() => appStore.state.selectedTab.key,
			(selectedTabKey) => {
				if (isUpdatingFromUrl.current) {
					return;
				}

				if (!selectedTabKey || selectedTabKey === '') {
					navigate('/', { replace: true });
					return;
				}

				// Build URL with only the selected tab key
				const urlPath = `/${selectedTabKey}`;
				const currentPath = location.pathname;

				// Only update URL if it's different
				if (currentPath !== urlPath) {
					navigate(urlPath, { replace: true });
				}
			},
		);

		// Cleanup
		return () => {
			if (reactionDisposer.current) {
				reactionDisposer.current();
				reactionDisposer.current = null;
			}
		};
	}, [navigate, location.pathname]);

	return null;
}

