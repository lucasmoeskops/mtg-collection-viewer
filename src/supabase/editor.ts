'use server';

import { CardChange } from "@/types/CardChange";
import getAuthenticatedAccountId from "./authenticate";
import { getClient } from "./client";
import { CardOwnershipData } from "@/types/CardOwnershipData";
import getMTGCardId from "./get-mtg-card-id";

export async function getOwnedCardsForSets(setCodes: string[], accountName: string, accountKey: string): Promise<CardOwnershipData[]> {
    if (setCodes.length === 0) {
        return [];
    }
    try {
        const userId = await getAuthenticatedAccountId(accountName, accountKey);
        if (userId === 0) {
            throw new Error('Authentication failed');
        }
        const supabaseClient = getClient();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        const { data: cards, error } = await supabaseClient
            .from('mtg_account_card')
            .select('amount, card!inner( series, cardnumber, is_foil )')
            .in('card.series', setCodes)
            .eq('account', userId)
            .gt('amount', 0);
        if (error) {
            console.error('Error fetching cards:', error);
            throw error;
        }
        if (!cards) {
            throw new Error('Error fetching cards');
        }
        return cards.map(card => ({
            setCode: 'series' in card.card ? card.card.series as string : '',
            collectorNumber: 'cardnumber' in card.card ? card.card.cardnumber.toString() : '',
            isFoil: 'is_foil' in card.card ? card.card.is_foil as boolean : false,
            amount: 'amount' in card ? card.amount as number : 0,
        }));
    } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
    }
}

export async function getOwnedCardsForIndividuals(cards: { setCode: string, collectorNumber: string}[], accountName: string, accountKey: string): Promise<CardOwnershipData[]> {
    // Always wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        const userId = await getAuthenticatedAccountId(accountName, accountKey);
        if (userId === 0) {
            throw new Error('Authentication failed');
        }
        const supabaseClient = getClient();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        const { data: cards, error } = await supabaseClient
            .from('mtg_account_card')
            .select('amount, card!inner( series, cardnumber, is_foil )')
            // .eq('card.series', setCode)
            .eq('account', userId)
            .gt('amount', 0);
        if (error) {
            console.error('Error fetching cards:', error);
            throw error;
        }
        if (!cards) {
            throw new Error('Error fetching cards');
        }
        return cards.map(card => ({
            setCode: 'series' in card.card ? card.card.series as string : '',
            collectorNumber: 'cardnumber' in card.card ? card.card.cardnumber.toString() : '',
            isFoil: 'is_foil' in card.card ? card.card.is_foil as boolean : false,
            amount: 'amount' in card ? card.amount as number : 0,
        }));
    } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
    }
}

export async function saveCardChanges(accountName: string, accountKey: string, changes: CardChange[]): Promise<CardOwnershipData[]> {
    const succesfulChanges: CardOwnershipData[] = [];
    if (changes.length === 0) {
        return succesfulChanges;
    }
    try {
        const userId = await getAuthenticatedAccountId(accountName, accountKey);
        if (userId === 0) {
            throw new Error('Authentication failed');
        }
        const supabaseClient = getClient();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        const changesWithIds = await Promise.all(changes.map(async change => {
            const cardId = await getMTGCardId(change.setId, change.collectorNumber, change.isFoil);
            return {
                ...change,
                cardId,
            };
        }));
        console.log('Saving card changes for user', userId, 'changes:', changesWithIds);
        for (const change of changesWithIds) {
            if (change.newAmount < 0) {
                throw new Error(`Invalid amount for card ${change.setId} ${change.collectorNumber} (${change.isFoil ? 'foil' : 'nonfoil'}): ${change.newAmount}`);
            }
            const { data:accountCardId, error:accountCardError } = await supabaseClient
                .from('mtg_account_card')
                .select('id')
                .eq('account', userId)
                .eq('card', change.cardId)
                .limit(1)
                .maybeSingle();
            if (accountCardError) {
                console.error('Error checking existing account card:', accountCardError);
                throw accountCardError;
            }
            console.log('Processing change for cardId', change.cardId, 'existing accountCardId:', accountCardId, 'newAmount:', change.newAmount);
            // Three cases:
            // 1. No existing entry, newAmount > 0: Insert new entry
            // 2. Existing entry, newAmount == 0: Delete entry
            // 3. Existing entry, newAmount > 0: Update entry
            // 4. No existing entry, newAmount == 0: Do nothing
            if (!accountCardId && change.newAmount > 0) {
                console.log('Inserting new account card for user', userId, 'card', change.cardId, 'amount', change.newAmount);
                const { error:insertError } = await supabaseClient
                    .from('mtg_account_card')
                    .insert({
                        account: userId,
                        card: change.cardId,
                        amount: change.newAmount,
                    });
                if (insertError) {
                    console.error('Error inserting new account card:', insertError);
                    continue
                }
            } else if (accountCardId && change.newAmount === 0) {
                console.log('Deleting account card for user', userId, 'card', change.cardId);
                const { error:deleteError } = await supabaseClient
                    .from('mtg_account_card')
                    .delete()
                    .eq('id', accountCardId.id);
                if (deleteError) {
                    console.error('Error deleting account card:', deleteError);
                    continue;
                }
            } else if (accountCardId && change.newAmount > 0) {
                console.log('Updating account card for user', userId, 'card', change.cardId, 'to amount', change.newAmount);
                const { error:updateError } = await supabaseClient
                    .from('mtg_account_card')
                    .update({
                        amount: change.newAmount,
                    })
                    .eq('id', accountCardId.id);
                if (updateError) {
                    console.error('Error updating account card:', updateError);
                    continue;
                }
            }
            succesfulChanges.push({
                setCode: change.setId,
                collectorNumber: change.collectorNumber,
                isFoil: change.isFoil,
                amount: change.newAmount,
            });
        }
        return succesfulChanges;
    } catch (error) {
        console.error('Error saving card changes:', error);
        throw error;
    }
}