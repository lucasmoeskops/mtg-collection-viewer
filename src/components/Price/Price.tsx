import { padStart } from "lodash"

export interface PriceProps {
    priceEstimate: number,
}

export function Price(props: PriceProps) {
    const {priceEstimate} = props

    if (priceEstimate < 100) {
        return <>&euro;<sub>{padStart(priceEstimate.toString(), 2, '0')}</sub></>
    }

    const euroPrice = Math.floor(priceEstimate / 100)
    const restPrice = (priceEstimate % 100).toString()

    return <>&euro;{euroPrice}<sub>{padStart(restPrice, 2, '0')}</sub></>
}