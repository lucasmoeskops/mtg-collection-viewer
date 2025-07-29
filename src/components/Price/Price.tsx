import { padStart } from "lodash"

export interface PriceProps {
    priceEstimate: number,
}

export function Price(props: PriceProps) {
    const {priceEstimate} = props
    const absPriceEstimate = Math.abs(priceEstimate);

    if (absPriceEstimate < 100) {
        return <>&euro;<sub>{padStart(absPriceEstimate.toString(), 2, '0')}</sub></>
    }

    const euroPrice = Math.floor(absPriceEstimate / 100)
    const restPrice = (absPriceEstimate % 100).toString()

    return <>&euro;{euroPrice}<sub>{padStart(restPrice, 2, '0')}</sub></>
}