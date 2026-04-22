import React from "react";

interface UseZoomOptions {
    initialZoom?: number;
    minZoom?: number;
    maxZoom?: number;
    step?: number;
  }

export const useZoom = (options: UseZoomOptions) => {
    const { initialZoom = 1.0, minZoom = 0.5, maxZoom = 5.0, step = 0.1 } = options;
    const [zoom, setZoom] = React.useState(initialZoom);
    const canZoomIn = zoom < maxZoom;
    const canZoomOut = zoom > minZoom;

    const zoomIn = React.useCallback(() => {
        setZoom(prev => Math.min(prev + step, maxZoom));
      }, [step, maxZoom]);
    
    const zoomOut = React.useCallback(() => {
        setZoom(prev => Math.max(prev - step, minZoom));
    }, [step, minZoom]);
    
    const resetZoom = React.useCallback(() => {
        setZoom(initialZoom);
    }, [initialZoom]);

    return {
        zoom,
        canZoomIn,
        canZoomOut,
        zoomIn,
        zoomOut,
        resetZoom,
    };
};