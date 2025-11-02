import { Amount } from "./Amount";
import { MTGCard } from "./MTGCard";

export type BoundMTGCard = {
    card: MTGCard,
    amount: Amount,
    amountFoil: Amount,
}
