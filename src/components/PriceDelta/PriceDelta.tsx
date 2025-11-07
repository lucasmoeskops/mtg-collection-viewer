import { Price, PriceHistoryProps } from "../Price/Price";

export interface PriceDeltaProps {
    price: number,
    avgPrice: number,
    label: string,
    history?: PriceHistoryProps,
}

export function PriceDelta(props: PriceDeltaProps) {
    const { price, avgPrice, label, history } = props;

    if (!avgPrice) {
        return null;
    }

    const delta = Math.floor(price - avgPrice);
    const absDelta = Math.abs(delta);

    return <span style={{ color: delta > 0 ? 'green' : 'red' }}>
        {delta >= 0 ? '+' : '-'}
        <Price label={label} priceEstimate={absDelta} history={history} />
    </span>
}