import { RenderMode } from "@/enums/RenderMode";
import MagicCardLike from "./MagicCardLike";
import { RenderEffect } from "@/enums/RenderEffect";

export default interface RenderableMagicCardLike extends MagicCardLike{
  renderMode: RenderMode,
  renderEffects: RenderEffect[],
}

export function makeRenderable(card: MagicCardLike, mode = RenderMode.DEFAULT, effects: RenderEffect[] = []): RenderableMagicCardLike {
    return {
        ...card,
        renderMode: mode,
        renderEffects: [...effects]
    }
} 