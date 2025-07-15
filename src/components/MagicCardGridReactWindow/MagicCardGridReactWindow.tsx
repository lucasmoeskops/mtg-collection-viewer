import { FixedSizeList as List } from 'react-window';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type MagicCardLike from '@/interfaces/MagicCardLike'


// const Cell = ({ columnIndex, rowIndex, style }) => (

// <div style={style}>

//     Item {rowIndex},{columnIndex}

// </div>

// );

export type MagicCardGridProps = {
    cards: MagicCardLike[]
};

/**
 * 
 * This component will show a grid of magic cards.
 * 
 * @param param0 
 */
export default function MagicCardGrid ({ cards }: MagicCardGridProps) {
    const theme = useTheme();
    const useTwoColumns = useMediaQuery(theme.breakpoints.up('sm')) && 2;
    const useThreeColumns = useMediaQuery(theme.breakpoints.up('md')) && 3;
    const useFourColumns = useMediaQuery(theme.breakpoints.up('lg')) && 4;
    const numColumns = useFourColumns || useThreeColumns || useTwoColumns || 1;
    return <List
        height={150}
        itemCount={Math.ceil(cards.length / numColumns)}
        itemSize={35}
        width={'100%'}
  >
    {Cell}
  </List>
}