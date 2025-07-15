import { CardSelectionContext } from "@/types/CardSelectionContext"
import RenderableMagicCardLike from "@/interfaces/RenderableMagicCardLike"
import MagicCardLike from "@/interfaces/MagicCardLike"

export type CardSelector = {
    (cards: MagicCardLike[], context: CardSelectionContext): RenderableMagicCardLike[]
}
