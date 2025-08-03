import { Price } from "../Price/Price";

export interface PriceDeltaProps {
    price: number,
    avgPrice: number,
    label: string,
}

export function PriceDelta(props: PriceDeltaProps) {
    const { price, avgPrice, label } = props;

    if (!avgPrice) {
        return null;
    }

    const delta = Math.floor(price - avgPrice);
    const absDelta = Math.abs(delta);

    if (!absDelta) {
        return null;
    }

    return <span style={{ color: delta > 0 ? 'green' : 'red' }}>
        {delta > 0 ? '+' : '-'}
        <Price label={label} priceEstimate={absDelta} />
    </span>
}