import { IconButton, Popover } from "@mui/material";
import { padStart } from "lodash"
import TimelineIcon from '@mui/icons-material/Timeline';
import { MouseEvent, useState } from "react";
import { PriceGraph } from "../PriceGraph/PriceGraph";

export interface PriceHistoryProps {
    cardId: number,
}

export interface PriceProps {
    priceEstimate: number,
    label: string,
    history?: PriceHistoryProps,
}

export function Price(props: PriceProps) {
    const {priceEstimate, label, history} = props
    const absPriceEstimate = Math.abs(priceEstimate);
    const historyComponent = history ? <GraphPopover history={history} /> : null;

    if (absPriceEstimate < 100) {
        return <>&euro;<sub>{padStart(absPriceEstimate.toString(), 2, '0')}</sub>{historyComponent}</>
    }

    const euroPrice = Math.floor(absPriceEstimate / 100)
    const restPrice = (absPriceEstimate % 100).toString()

    return <>
        <span aria-label={label} title={label}>&euro;{euroPrice}<sub>{padStart(restPrice, 2, '0')}</sub></span>
        {historyComponent}
    </>
}

function GraphPopover({ history }: { history: PriceHistoryProps }) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return <>
        <IconButton aria-describedby={id} onClick={handleClick}>
            <TimelineIcon fontSize="small" style={{ verticalAlign: 'middle', marginLeft: 2 }}>info</TimelineIcon>
        </IconButton>
        <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={{ top: 20, left: 20 }}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <div style={{ width: 'calc(100vw - 64px)', height: '300px' }}>
                <PriceGraph cardId={history.cardId} />
            </div>
        </Popover>
    </>
}
