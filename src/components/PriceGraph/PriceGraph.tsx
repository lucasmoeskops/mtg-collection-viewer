import { registerChartJs } from "@/helpers/setup-chartjs";
import { getPriceHistoryForCard } from "@/supabase/server";
import { Typography } from "@mui/material";
import { Chart } from "chart.js";
import { padStart } from "lodash";
import { useEffect, useRef, useState } from "react";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getPriceLabelForValue(value: number): string {
    const euroPrice = Math.floor(value / 100)
    const restPrice = (value % 100).toString()
    return `€${euroPrice},${padStart(restPrice, 2, '0')}`;
}

function getTimeLabelForValue(value: string): string {
    const date = new Date(value);
    return date.getMonth() === 0 ? date.getFullYear().toString() : MONTH_NAMES[date.getMonth()];
}

export function PriceGraph({ cardId }: { cardId: number }) {
    const [data, setData] = useState<{ timestamp: string; price: number }[]>([]);
    const chartRef =  useRef<HTMLCanvasElement>(null);
    const chartChartRef =  useRef<Chart | null>(null);

    useEffect(() => {
        registerChartJs();
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        chartChartRef.current =new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(point => point.timestamp),
                datasets: [{
                    label: 'Price',
                    data: data.map(point => point.price),
                    borderColor: 'blue',
                    fill: false
                }]
            },
            options: {
                scales: {
                    y: { 
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return getPriceLabelForValue(value as number);
                            },
                        }
                    },
                    x: { 
                        display: true,
                        ticks: {
                            callback: function(value, index, ticks) {
                                if (index === 0 || index === ticks.length - 1) {
                                    const date = new Date(data[index].timestamp);
                                    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
                                }
                                const label = getTimeLabelForValue(data[index].timestamp);
                                const previousLabel = getTimeLabelForValue(data[index - 1].timestamp);
                                if (label !== previousLabel) {
                                    return label;
                                }
                                return '';
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
            }
            });
        return () => {
            chartChartRef.current?.destroy();
        }
    }, [chartRef, data]);

    useEffect(() => {
        getPriceHistoryForCard(cardId).then(fetchedData => {
            setData(fetchedData);
        });
    }, [cardId]);

    if (data.length === 0) {
        return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="textSecondary">
                Loading...
            </Typography>
        </div>
    }
    
    return <canvas ref={chartRef} id="chart" style={{ minWidth: '400px', minHeight: '300px', width: '100%', height: '100%' }}
></canvas>
}