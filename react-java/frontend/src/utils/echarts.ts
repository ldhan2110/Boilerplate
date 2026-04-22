/**
 * ECharts tree-shaking setup — import only the required chart types and components.
 * All chart components should import echarts from this file instead of 'echarts' directly.
 */
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import {
	CalendarComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
	TitleComponent,
	VisualMapComponent,
	RadarComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
	BarChart,
	LineChart,
	PieChart,
	RadarChart,
	CalendarComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
	TitleComponent,
	VisualMapComponent,
	RadarComponent,
	CanvasRenderer,
]);

export default echarts;
